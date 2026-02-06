<script lang="ts">
  import { authClient } from '$lib/auth-client';

  let email = '';
  let password = '';
  let errorMessage: string | null = null;
  let pending = false;

  async function submit(): Promise<void> {
    pending = true;
    errorMessage = null;

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: '/'
    });

    if (result.error) {
      errorMessage = result.error.message ?? 'Unable to sign in';
    }

    pending = false;
  }
</script>

<section class="auth-card">
  <h1>Sign In</h1>
  <p>Use your Haveri account credentials.</p>

  <form
    on:submit|preventDefault={() => {
      void submit();
    }}
  >
    <label>
      Email
      <input bind:value={email} type="email" required autocomplete="email" />
    </label>

    <label>
      Password
      <input bind:value={password} type="password" required autocomplete="current-password" />
    </label>

    {#if errorMessage}
      <p class="error">{errorMessage}</p>
    {/if}

    <button type="submit" disabled={pending}>{pending ? 'Signing in...' : 'Sign in'}</button>
  </form>

  <p class="aux">No account? <a href="/register">Register</a></p>
</section>

<style>
  .auth-card {
    max-width: 420px;
    margin: 4rem auto;
    border: 1px solid #d8d4c8;
    border-radius: 12px;
    padding: 1.5rem;
    background: #fff;
  }

  form {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
    font-weight: 600;
  }

  input {
    border: 1px solid #b5b8bb;
    border-radius: 6px;
    padding: 0.55rem 0.65rem;
  }

  .error {
    color: #a33a2a;
    margin: 0;
  }

  .aux {
    margin-top: 1rem;
    font-size: 0.95rem;
  }
</style>
