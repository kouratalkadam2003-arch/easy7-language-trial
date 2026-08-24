import { useState, useEffect } from 'react';
import { getDocs, getDocsFromCache, Query, DocumentData, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * خطاف مخصص لجلب البيانات من Firestore بذكاء لتقليل التكلفة.
 * يفضل جلب البيانات من التخزين المحلي (Cache) إذا لم تنتهِ صلاحيتها (ttlMinutes).
 * @param queryOrPath اسم المجموعة (مسار) أو استعلام Firestore
 * @param ttlMinutes مدة صلاحية البيانات بالدقائق (افتراضي 24 ساعة = 1440 دقيقة)
 */
export const useSmartFirestore = (queryOrPath: Query<DocumentData> | string, ttlMinutes: number = 1440) => {
    // حالة للبيانات
    const [data, setData] = useState<DocumentData[] | null>(null);
    // حالة التحميل
    const [loading, setLoading] = useState<boolean>(true);
    // حالة الأخطاء
    const [error, setError] = useState<Error | null>(null);
    // حالة تبين إن كان المستخدم غير متصل بالإنترنت
    const isOffline = !navigator.onLine;

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!queryOrPath) return;

            setLoading(true);
            
            // استنتاج الاستعلام واسمه 
            const queryName = typeof queryOrPath === 'string' ? queryOrPath : JSON.stringify(queryOrPath);
            const actualQuery = typeof queryOrPath === 'string' ? collection(db, queryOrPath) : queryOrPath;
            
            const cacheKey = `lastFetch_${queryName}`;
            
            // الخطوة 1: جلب وقت آخر تحديث ناجح من localStorage
            const lastFetchStr = localStorage.getItem(cacheKey);
            const lastFetch = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
            
            // الخطوة 2: حساب الوقت المنقضي
            const now = Date.now();
            const timeDiff = now - lastFetch;
            const ttlMs = ttlMinutes * 60 * 1000;

            let hasLocalData = false;

            try {
                // الخطوة 3: عرض البيانات المحفوظة محلياً فوراً (إن وجدت)
                const cacheSnapshot = await getDocsFromCache(actualQuery);
                if (!cacheSnapshot.empty) {
                    const cachedDocs = cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    if (isMounted) {
                        setData(cachedDocs);
                        hasLocalData = true;
                    }
                }
            } catch (err: any) {
                // قد يفشل جلب التخزين المؤقت في البداية إن لم يكن هناك بيانات محلياً
                console.info('لا توجد بيانات محلية حتى الآن', queryName);
            }

            // الخطوة 4: اتخاذ قرار الاتصال الشبكي
            if (timeDiff < ttlMs && hasLocalData) {
                // البيانات لم تنتهِ صلاحيتها ولدينا بيانات
                if (isMounted) {
                    setLoading(false);
                }
                return;
            }

            // تحديث من الشبكة بالخلفية إذا انتهت الصلاحية أو لا يوجد كاش
            try {
                const networkSnapshot = await getDocs(actualQuery);
                const newDocs = networkSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (isMounted) {
                    // تحديث الحالة
                    setData(newDocs);
                    // حفظ وقت التحديث
                    localStorage.setItem(cacheKey, now.toString());
                }
            } catch (err: any) {
                console.error("فشل إحضار البيانات من الشبكة:", err);
                // استخدام الخطأ فقط لو لم نكن نعرض بيانات محلية بالفعل
                if (isMounted && !hasLocalData) {
                    setError(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [queryOrPath, ttlMinutes]);

    return { data, loading, error, isOffline };
};
