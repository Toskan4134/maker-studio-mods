// index.js
import { mountTownMapEditor } from './editor_ui.js';

let activeDialog = null; 

export function activate(ctx) {
  ctx.menu.registerMenuItem({
    menu: "Mods",
    label: "Town Map Editor",
    handler: () => {
      
      if (activeDialog) return;

      
      activeDialog = ctx.ui.showCustomDialog({
        title: "Town Map Editor",
        width: "800px",  
        height: "600px", 
        render: (body) => {
          
          const cleanup = mountTownMapEditor(ctx, body);

          
          return () => {
            if (typeof cleanup === 'function') {
              cleanup();
            }
            activeDialog = null; 
          };
        }
      });
    }
  });

  ctx.log.info("Town Map Editor inicializado en modo ventana (Dialog).");
}

export function deactivate() {
  
  if (activeDialog) {
    activeDialog.close();
    activeDialog = null;
  }
}