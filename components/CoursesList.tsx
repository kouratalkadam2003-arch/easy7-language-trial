import React from 'react';
import { useSmartFirestore } from '../hooks/useSmartFirestore';

interface Course {
    id: string;
    title: string;
    description: string;
    level: string;
    words: string[];
}

const CoursesList: React.FC = () => {
    // استخدام الخطاف המخصص مع مسار 'courses'
    const { data, loading, error, isOffline } = useSmartFirestore('courses');

    return (
        <div className="p-6 max-w-4xl mx-auto" dir="rtl">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">قائمة الدروس</h1>

            {/* شارة حالة الاتصال */}
            {isOffline && (
                <div className="bg-yellow-100 text-yellow-800 text-sm p-3 rounded-lg mb-6 shadow-sm border border-yellow-200">
                    ⚠️ أنت غير متصل، البيانات المعروضة من آخر تحديث.
                </div>
            )}

            {/* رسالة الخطأ */}
            {error && (
                <div className="bg-red-100 text-red-800 text-sm p-3 rounded-lg mb-6 border border-red-200">
                    حدث خطأ أثناء تحميل الدروس: {error.message}
                </div>
            )}

            {/* مؤشر التحميل الأولي */}
            {loading && !data && (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-indigo-600 mr-3">جاري تحميل الدروس...</span>
                </div>
            )}

            {/* قائمة الدروس */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.length === 0 ? (
                        <p className="text-gray-500 col-span-2 text-center py-8">لا توجد دروس متاحة حالياً.</p>
                    ) : (
                        (data as Course[]).map(course => (
                            <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-xl font-bold text-gray-800">{course.title}</h2>
                                        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold">
                                            {course.level}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                                        {course.description}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 mb-2 font-semibold">الكلمات المفتاحية:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {course.words && course.words.map((word, idx) => (
                                                <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CoursesList;
