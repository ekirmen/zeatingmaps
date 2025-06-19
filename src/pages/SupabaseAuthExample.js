import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SupabaseAuthExample = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);
    setUser(data.user);
  };

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError(error.message);
    setUser(data.user);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="p-4">
      <h1>Supabase Auth Demo</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!user ? (
        <div className="space-y-2">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div>
            <button onClick={handleSignIn}>Sign In</button>
            <button onClick={handleSignUp}>Sign Up</button>
          </div>
        </div>
      ) : (
        <div>
          <p>Signed in as {user.email}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      )}
    </div>
  );
};

export default SupabaseAuthExample;
