export default function Home() {
useEffect(() => {
    router.push('/dashboard')
  }, [])
  return (
    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      "
    >
      LearnScape
    </div>
  );
}