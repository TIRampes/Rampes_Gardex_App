// Ce script doit être exécuté AVANT le rendu React
// À ajouter dans app/layout.tsx dans le <head>

export const themeInitScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme-mode');
      var palette = localStorage.getItem('theme-palette');
      
      // Appliquer le thème
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
      
      // Appliquer la palette
      if (palette) {
        try {
          var p = JSON.parse(palette);
          if (p.primary) {
            document.documentElement.style.setProperty('--color-primary', p.primary);
            document.documentElement.style.setProperty('--color-primary-light', p.primaryLight || p.primary);
            document.documentElement.style.setProperty('--color-primary-dark', p.primaryDark || p.primary);
          }
        } catch(e) {}
      }
    } catch(e) {}
  })();
`;

// Version inline pour le layout
export const ThemeInitScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            var theme = localStorage.getItem('theme-mode');
            var palette = localStorage.getItem('theme-palette');
            
            if (theme === 'light') {
              document.documentElement.classList.add('light');
              document.documentElement.classList.remove('dark');
            } else {
              document.documentElement.classList.add('dark');
              document.documentElement.classList.remove('light');
            }
            
            if (palette) {
              try {
                var p = JSON.parse(palette);
                if (p.primary) {
                  document.documentElement.style.setProperty('--color-primary', p.primary);
                  document.documentElement.style.setProperty('--color-primary-light', p.primaryLight || p.primary);
                  document.documentElement.style.setProperty('--color-primary-dark', p.primaryDark || p.primary);
                }
              } catch(e) {}
            }
          } catch(e) {}
        })();
      `,
    }}
  />
);