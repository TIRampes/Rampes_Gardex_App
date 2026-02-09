// app/test/page.tsx
export default function TestPage() {
  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-3xl font-bold text-gardex-orange mb-6">
        Test des couleurs Gardex
      </h1>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Test avec fonds colorés */}
        <div className="p-6 bg-gardex-black text-white rounded-xl shadow">
          <p className="font-bold">bg-gardex-black</p>
          <p className="text-sm opacity-80">#1a2332</p>
        </div>
        
        <div className="p-6 bg-gardex-orange text-white rounded-xl shadow">
          <p className="font-bold">bg-gardex-orange</p>
          <p className="text-sm opacity-80">#F5A623</p>
        </div>
        
        <div className="p-6 bg-gardex-orange-light text-white rounded-xl shadow">
          <p className="font-bold">bg-gardex-orange-light</p>
          <p className="text-sm opacity-80">#FFBD4A</p>
        </div>
        
        <div className="p-6 bg-gardex-orange-dark text-white rounded-xl shadow">
          <p className="font-bold">bg-gardex-orange-dark</p>
          <p className="text-sm opacity-80">#D4890F</p>
        </div>
        
        <div className="p-6 bg-gardex-black-light text-white rounded-xl shadow">
          <p className="font-bold">bg-gardex-black-light</p>
          <p className="text-sm opacity-80">#2d3748</p>
        </div>
      </div>
      
      <div className="mt-8 p-4 border border-red-300 bg-red-50 rounded">
        <h2 className="text-red-700 font-bold mb-2">Si vous ne voyez pas les couleurs :</h2>
        <ol className="list-decimal pl-5 text-red-600">
          <li>Vérifiez que `globals.css` contient `@tailwind base; @tailwind components; @tailwind utilities;`</li>
          <li>Redémarrez le serveur : `npm run dev`</li>
          <li>Rechargez la page avec Ctrl+F5</li>
        </ol>
      </div>
    </div>
  );
}