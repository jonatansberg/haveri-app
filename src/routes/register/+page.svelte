<script lang="ts">
  import { authClient } from '$lib/auth-client';

  let name = '';
  let email = '';
  let password = '';
  let errorMessage: string | null = null;
  let pending = false;

  async function submit(): Promise<void> {
    pending = true;
    errorMessage = null;

    const result = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: '/'
    });

    if (result.error) {
      errorMessage = result.error.message ?? 'Unable to register';
    }

    pending = false;
  }
</script>

<section class="auth-card">
  <h1>Create Account</h1>
  <p>Set up a local user for MVP evaluation.</p>

  <form
    on:submit|preventDefault={() => {
      void submit();
    }}
  >
    <label>
      Name
      <input bind:value={name} type="text" required autocomplete="name" />
    </label>

    <label>
      Email
      <input bind:value={email} type="email" required autocomplete="email" />
    </label>

    <label>
      Password
      <input bind:value={password} type="password" required minlength="8" autocomplete="new-password" />
    </label>

    {#if errorMessage}
      <p class="error">{errorMessage}</p>
    {/if}

    <button type="submit" disabled={pending}>{pending ? 'Creating account...' : 'Create account'}</button>
  </form>

  <p class="aux">Already registered? <a href="/login">Sign in</a></p>
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
