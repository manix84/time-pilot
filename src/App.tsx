import TimePilotGame from "./components/TimePilotGame";

function App() {
  return (
    <main className={"app-shell"}>
      <header className={"app-header"}>
        <h1>Time Pilot</h1>
        <p>
          Modernized React + TypeScript port of the original arcade prototype.
        </p>
      </header>
      <section className={"game-panel"}>
        <TimePilotGame debug />
      </section>
    </main>
  );
}

export default App;
