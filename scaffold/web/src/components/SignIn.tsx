import { BrandMark } from './icons';

export function SignIn() {
  return (
    <main className="signin">
      <div className="signin-card">
        <BrandMark size={40} />
        <h1>Switchboard</h1>
        <p>One shared inbox for every customer text.</p>
        <a className="btn btn-primary btn-block" href="/auth/login">Sign in with your work account</a>
      </div>
    </main>
  );
}
