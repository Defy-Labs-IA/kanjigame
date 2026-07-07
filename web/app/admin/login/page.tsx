export default function LoginPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  return (
    <main className="wrap">
      <form className="login" action="/api/admin/login" method="post">
        <div className="logo jp">漢字</div>
        <h2>Painel do administrador</h2>
        <input
          type="password"
          name="password"
          placeholder="Senha de administrador"
          autoFocus
          required
        />
        <button className="btn" type="submit" style={{ width: "100%" }}>
          Entrar
        </button>
        <div className="erro">
          {searchParams?.erro ? "Senha incorreta." : ""}
        </div>
      </form>
    </main>
  );
}
