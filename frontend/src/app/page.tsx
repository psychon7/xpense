import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to Xpense
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Split expenses with friends and family 🤝 Track your spending 📊 Stay organized 📱
          </p>
          <div className="space-x-4">
            <Link 
              href="/login"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Get Started 🚀
            </Link>
            <Link 
              href="/login"
              className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-indigo-600"
            >
              Login ➡️
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Split Expenses</h3>
              <p className="text-gray-600 dark:text-gray-300">Easily split bills and track who owes what</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Track Spending</h3>
              <p className="text-gray-600 dark:text-gray-300">Monitor your expenses with beautiful charts</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Get Notified</h3>
              <p className="text-gray-600 dark:text-gray-300">Stay updated on payments and settlements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
