import { Shield } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
      <div className="text-center">
        <div className="inline-block p-6 bg-white rounded-full shadow-2xl mb-6 animate-bounce">
          <Shield className="w-20 h-20 text-emerald-500" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">CycleSafe</h1>
        <p className="text-xl text-emerald-100">Navigation App</p>
        <div className="mt-8">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
