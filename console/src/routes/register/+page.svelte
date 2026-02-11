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

  let name = '';
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
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: '/'
      });

      const resultError = getAuthResultErrorMessage(result, 'Unable to register');
      if (resultError) {
        errorMessage = resultError;
        return;
      }

      const unexpectedResultError = getAuthUnexpectedResultMessage(result);
      if (unexpectedResultError) {
        errorMessage = unexpectedResultError;
        return;
      }

      infoMessage = 'Account created. Redirecting...';
      await goto('/');
    } catch (error) {
      errorMessage = getAuthThrownErrorMessage(error, 'Unable to register');
    } finally {
      pending = false;
    }
  }
</script>

<section class="mx-auto mt-16 w-full max-w-md">
  <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
    <Card.Header>
      <Card.Title class="text-3xl text-slate-900">Create Account</Card.Title>
      <Card.Description class="text-slate-600">Set up a local user for MVP evaluation.</Card.Description>
    </Card.Header>

    <Card.Content>
      <form
        class="grid gap-5"
        on:submit|preventDefault={() => {
          void submit();
        }}
      >
        <div class="grid gap-2">
          <Label for="register-name">Name</Label>
          <Input id="register-name" bind:value={name} type="text" required autocomplete="name" />
        </div>

        <div class="grid gap-2">
          <Label for="register-email">Email</Label>
          <Input id="register-email" bind:value={email} type="email" required autocomplete="email" />
        </div>

        <div class="grid gap-2">
          <Label for="register-password">Password</Label>
          <Input
            id="register-password"
            bind:value={password}
            type="password"
            required
            minlength={8}
            autocomplete="new-password"
          />
        </div>

        {#if errorMessage}
          <Alert.Root variant="destructive" class="bg-red-50/70">
            <AlertCircle />
            <Alert.Title>Registration failed</Alert.Title>
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
            Creating account...
          {:else}
            Create account
          {/if}
        </Button>
      </form>
    </Card.Content>

    <Card.Footer class="text-sm text-slate-600">
      Already registered?
      <a class="font-medium text-slate-900 underline underline-offset-4" href="/login">Sign in</a>
    </Card.Footer>
  </Card.Root>
</section>
