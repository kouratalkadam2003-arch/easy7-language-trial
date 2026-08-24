import React from 'react';
import parse, { attributesToProps, domToReact } from 'html-react-parser';
import { useNavigate } from 'react-router-dom';

// Text mapping to route paths for BottomNavBar navigation
const bottomNavMap: Record<string, string> = {
  'Farm': '/SrsWordFarmDashboard',
  'Lessons': '/AdventureMapPath',
  'Leader': '/GlobalRankings',
  'Event': '/SeasonalEventHub', // Some screens use Event
  'Shop': '/FarmSupplyShop',
  'Profile': '/EditProfile'
};

export default function InteractiveScreen({ htmlContent }: { htmlContent: string }) {
  const navigate = useNavigate();

  const options = {
    replace: (domNode: any) => {
      // Intercept anchor tags
      if (domNode.name === 'a') {
        const props = attributesToProps(domNode.attribs);
        
        // Find text content inside this node to guess where it goes
        let innerText = '';
        const extractText = (node: any) => {
           if (node.type === 'text') innerText += node.data;
           if (node.children) node.children.forEach(extractText);
        };
        extractText(domNode);
        
        const routeKeys = Object.keys(bottomNavMap);
        let targetRoute = '';
        for (const key of routeKeys) {
            if (innerText.includes(key)) {
                targetRoute = bottomNavMap[key];
                break;
            }
        }
        
        // We override onClick to handle routing
        const handleClick = (e: React.MouseEvent) => {
          e.preventDefault();
          if (targetRoute) {
            navigate(targetRoute);
          } else if (props.href && props.href !== '#') {
            // maybe an actual link? 
            navigate(props.href as string);
          } else {
             // Let's guess where else they might go
             if (innerText.includes('Welcome')) navigate('/WelcomeScreen');
             if (innerText.includes('Login')) navigate('/LoginScreen');
             if (innerText.includes('Get Started')) navigate('/LanguageSelectionScreen');
             if (innerText.includes('Back') || innerText.includes('arrow_back')) navigate(-1);
          }
        };

        return (
          <a {...props} onClick={handleClick} style={{ cursor: 'pointer', ...props.style }}>
            {domNode.children ? domToReact(domNode.children, options) : null}
          </a>
        );
      }

      // We can also intercept buttons or specific icons for back buttons
      if (domNode.name === 'button') {
        const props = attributesToProps(domNode.attribs);
        
        // Find text content inside this node
        let innerText = '';
        const extractText = (node: any) => {
           if (node.type === 'text') innerText += node.data;
           if (node.children) node.children.forEach(extractText);
        };
        extractText(domNode);
        
        const handleClick = (e: React.MouseEvent) => {
          const currentPath = window.location.pathname;
          // Add known actions here based on text content
          if (innerText.includes('arrow_back') || innerText.includes('close')) navigate(-1);
          else if (innerText.includes('Welcome') || innerText.includes('Get Started')) navigate('/LanguageSelectionScreen');
          else if (innerText.includes('Login')) {
              if (currentPath.includes('LoginScreen')) {
                 navigate('/SrsWordFarmDashboard'); // Go to dashboard!
              } else {
                 navigate('/LoginScreen');
              }
          }
          else if (innerText.includes('Play') || innerText.includes('Select Level')) navigate('/LevelSelectionModal');
          else if (innerText.includes('Start Game') || innerText.includes('Battle')) navigate('/BossBattleWordMonster');
          else if (innerText.includes('Next') || innerText.includes('Continue')) navigate('/AdventureMapPath');
          else if (innerText.includes('Start Lesson') || innerText.includes('Start')) navigate('/InteractiveLanguageQuizStage');
          else if (innerText.includes('Save')) console.log('Saved');
          else if (innerText.includes('Shop') || innerText.includes('Buy')) navigate('/FarmSupplyShop');
        };

        return (
           <button {...props} onClick={handleClick}>
             {domNode.children ? domToReact(domNode.children, options) : null}
           </button>
        );
      }

      // Also handle div clicks that might be interactive (like a back button div)
      if (domNode.name === 'div' && domNode.attribs && domNode.attribs.class && domNode.attribs.class.includes('cursor-pointer')) {
          const props = attributesToProps(domNode.attribs);
          let innerText = '';
          const extractText = (node: any) => {
             if (node.type === 'text') innerText += node.data;
             if (node.children) node.children.forEach(extractText);
          };
          extractText(domNode);
          
          const handleClick = (e: React.MouseEvent) => {
               // Check if it's one of the bottom tab bars (sometimes they use divs)
               const routeKeys = Object.keys(bottomNavMap);
               let targetRoute = '';
               for (const key of routeKeys) {
                   if (innerText.includes(key)) {
                       targetRoute = bottomNavMap[key];
                       break;
                   }
               }
               if (targetRoute) {
                   navigate(targetRoute);
               } else if (innerText.includes('arrow_back') || innerText.includes('close')) {
                   navigate(-1);
               } else {
                   // some fallback
               }
          };
          
          return (
              <div {...props} onClick={handleClick}>
                 {domNode.children ? domToReact(domNode.children, options) : null}
              </div>
          )
      }
    }
  };

  return <>{parse(htmlContent, options)}</>;
}
