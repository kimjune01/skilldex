/**
 * Debug Page
 *
 * For previewing design elements like avatar emojis.
 */

const animals = ['🐶', '🐱', '🐻', '🦊', '🐰', '🐼', '🦁', '🐮', '🐷', '🐸', '🐵', '🦉'];
const accessories = ['👓', '🕶️', '🧢'];

export default function Debug() {
  return (
    <div className="min-h-screen bg-gray-100 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-12">Debug: Animal + Accessory Avatars</h1>

        {accessories.map((accessory) => (
          <div key={accessory} className="mb-16">
            <h2 className="text-2xl font-bold text-gray-700 mb-6">
              With {accessory === '👓' ? 'Glasses' : accessory === '🕶️' ? 'Sunglasses' : 'Cap'} {accessory}
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-8">
              {animals.map((animal) => (
                <div key={animal + accessory} className="flex flex-col items-center gap-3">
                  <div className="h-28 w-28 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-gray-200 relative">
                    <span className="text-6xl">{animal}</span>
                    <span className={`absolute ${accessory === '🧢' ? 'text-5xl top-3' : 'text-4xl top-8'}`}>{accessory}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
