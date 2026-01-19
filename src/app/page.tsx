export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-yellow-400 p-24">
      <h1 className="text-4xl font-bold text-red-600">
        Tailwind 接続テスト: この背景が黄色なら成功
      </h1>
      <p className="mt-4 text-black">
        もし背景が白のままなら、CSSが読み込まれていません。
      </p>
    </main>
  );
}