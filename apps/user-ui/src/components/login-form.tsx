'use client';
import { useAuth, useLogin, useLogout } from '@eshopper/client-auth/client';
import { useState } from 'react';

export function LoginForm() {
  const login = useLogin();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const logout = useLogout();

  if (isAuthenticated && user) {
    console.log('user', user);
    return (
      <div>
        Logged in as {user.user.email}
        <div>
          <button onClick={() => logout.mutate({ logoutAll: false })}>
            Logout
          </button>
        </div>
      </div>
    );
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => login.mutate({ email, password })}>Login</button>
    </div>
  );
}
