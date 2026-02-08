<script lang="ts">
  import { goto } from '$app/navigation';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import {
    getAuthResultErrorMessage,
    getAuthThrownErrorMessage,
    getAuthUnexpectedResultMessage
  } from '$lib/auth-errors';
  import { authClient } from '$lib/auth-client';
  import * as Alert from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let email = '';
  let password = '';
  let errorMessage: string | null = null;
  let infoMessage: string | null = null;
  let pending = false;

  async function submit(): Promise<void> {
    if (pending) {
      return;
    }

    pending = true;
    errorMessage = null;
    infoMessage = null;

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/'
      });

      const resultError = getAuthResultErrorMessage(result, 'Unable to sign in');
      if (resultError) {
        errorMessage = resultError;
        return;
      }

      const unexpectedResultError = getAuthUnexpectedResultMessage(result);
      if (unexpectedResultError) {
        errorMessage = unexpectedResultError;
        return;
      }

      infoMessage = 'Signed in. Redirecting...';
      await goto('/');
    } catch (error) {
      errorMessage = getAuthThrownErrorMessage(error, 'Unable to sign in');
    } finally {
      pending = false;
    }
  }
</script>

<section class="mx-auto mt-16 w-full max-w-md">
  <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
    <Card.Header>
      <Card.Title class="text-3xl text-slate-900">Sign In</Card.Title>
      <Card.Description class="text-slate-600">Use your Haveri account credentials.</Card.Description>
    </Card.Header>

    <Card.Content>
      <form
        class="grid gap-5"
        on:submit|preventDefault={() => {
          void submit();
        }}
      >
        <div class="grid gap-2">
          <Label for="login-email">Email</Label>
          <Input id="login-email" bind:value={email} type="email" required autocomplete="email" />
        </div>

        <div class="grid gap-2">
          <Label for="login-password">Password</Label>
          <Input
            id="login-password"
            bind:value={password}
            type="password"
            required
            autocomplete="current-password"
          />
        </div>

        {#if errorMessage}
          <Alert.Root variant="destructive" class="bg-red-50/70">
            <AlertCircle />
            <Alert.Title>Sign-in failed</Alert.Title>
            <Alert.Description>{errorMessage}</Alert.Description>
          </Alert.Root>
        {/if}

        {#if infoMessage}
          <Alert.Root class="border-amber/30 bg-amber-glow text-slate-900">
            <AlertCircle />
            <Alert.Title>Success</Alert.Title>
            <Alert.Description>{infoMessage}</Alert.Description>
          </Alert.Root>
        {/if}

        <Button type="submit" disabled={pending} class="w-full">
          {#if pending}
            <LoaderCircle class="size-4 animate-spin" />
            Signing in...
          {:else}
            Sign in
          {/if}
        </Button>
      </form>
    </Card.Content>

    <Card.Footer class="text-sm text-slate-600">
      No account? <a class="font-medium text-slate-900 underline underline-offset-4" href="/register">Register</a>
    </Card.Footer>
  </Card.Root>
</section>
