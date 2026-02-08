<script lang="ts">
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import type { ActionData, PageData } from './$types';
  import * as Alert from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Separator } from '$lib/components/ui/separator';
  import * as Table from '$lib/components/ui/table';

  export let data: PageData;
  export let form: ActionData | null = null;

  const severities = ['SEV1', 'SEV2', 'SEV3'] as const;

  let title = '';
  let declareSeverity: (typeof severities)[number] = 'SEV2';
  let facilityId = data.facilities[0]?.id ?? '';
  let assignedToMemberId = data.members[0]?.id ?? '';
  let commsLeadMemberId = '';

  function memberLabel(memberId: string): string {
    const member = data.members.find((candidate) => candidate.id === memberId);
    return member ? `${member.name} (${member.role})` : 'Select member';
  }

  function facilityLabel(selectedId: string): string {
    return data.facilities.find((facility) => facility.id === selectedId)?.name ?? 'Select facility';
  }

  function severityBadgeClass(severity: string): string {
    if (severity === 'SEV1') {
      return 'border-transparent bg-sev1 text-white';
    }

    if (severity === 'SEV2') {
      return 'border-transparent bg-sev2 text-slate-950';
    }

    return 'border-transparent bg-sev3 text-white';
  }
</script>

<section class="grid gap-6">
  <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
    <Card.Header>
      <Card.Title class="text-3xl text-slate-900">Open Incidents</Card.Title>
      <Card.Description class="text-slate-600">
        Declare and track production incidents from the web dashboard.
      </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-4">
      {#if form?.error}
        <Alert.Root variant="destructive" class="bg-red-50/70">
          <AlertTriangle />
          <Alert.Title>Unable to declare incident</Alert.Title>
          <Alert.Description>Check the form values and try again.</Alert.Description>
        </Alert.Root>
      {/if}

      <form method="POST" action="?/declare" class="grid gap-4 lg:grid-cols-2">
        <div class="grid gap-2 lg:col-span-2">
          <Label for="incident-title">Title</Label>
          <Input
            id="incident-title"
            name="title"
            bind:value={title}
            placeholder="Packaging line jammed at station 4"
            required
          />
        </div>

        <div class="grid gap-2">
          <Label for="incident-severity">Severity</Label>
          <Select.Root type="single" name="severity" bind:value={declareSeverity}>
            <Select.Trigger id="incident-severity" class="w-full justify-between">
              {declareSeverity}
            </Select.Trigger>
            <Select.Content>
              {#each severities as severity}
                <Select.Item value={severity} label={severity} />
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="grid gap-2">
          <Label for="incident-facility">Facility</Label>
          <Select.Root type="single" name="facilityId" bind:value={facilityId}>
            <Select.Trigger id="incident-facility" class="w-full justify-between">
              {facilityLabel(facilityId)}
            </Select.Trigger>
            <Select.Content>
              {#each data.facilities as facility}
                <Select.Item value={facility.id} label={facility.name} />
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="grid gap-2">
          <Label for="incident-responsible">Responsible Lead</Label>
          <Select.Root type="single" name="assignedToMemberId" bind:value={assignedToMemberId}>
            <Select.Trigger id="incident-responsible" class="w-full justify-between">
              {memberLabel(assignedToMemberId)}
            </Select.Trigger>
            <Select.Content>
              {#each data.members as member}
                <Select.Item value={member.id} label={`${member.name} (${member.role})`} />
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="grid gap-2">
          <Label for="incident-comms">Comms Lead (optional)</Label>
          <Select.Root type="single" name="commsLeadMemberId" bind:value={commsLeadMemberId}>
            <Select.Trigger id="incident-comms" class="w-full justify-between">
              {commsLeadMemberId ? memberLabel(commsLeadMemberId) : 'None'}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="" label="None" />
              {#each data.members as member}
                <Select.Item value={member.id} label={`${member.name} (${member.role})`} />
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="flex items-end">
          <Button type="submit" class="w-full lg:w-auto">Declare Incident</Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
    <Card.Header>
      <Card.Title class="text-2xl text-slate-900">Recent Incidents</Card.Title>
      <Card.Description class="text-slate-600">Current and recently updated incident records.</Card.Description>
    </Card.Header>

    <Card.Content>
      {#if data.incidents.length === 0}
        <Alert.Root class="border-warm-300 bg-warm-100/70 text-slate-800">
          <AlertTriangle />
          <Alert.Title>No incidents yet</Alert.Title>
          <Alert.Description>Declare the first incident using the form above.</Alert.Description>
        </Alert.Root>
      {:else}
        <div class="overflow-x-auto rounded-lg border border-warm-300/80">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Title</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Severity</Table.Head>
                <Table.Head>Facility</Table.Head>
                <Table.Head>Responsible</Table.Head>
                <Table.Head>Comms</Table.Head>
                <Table.Head>Declared</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each data.incidents as incident}
                <Table.Row>
                  <Table.Cell>
                    <a class="font-medium text-slate-900 underline-offset-4 hover:underline" href={`/incidents/${incident.id}`}>
                      {incident.title}
                    </a>
                  </Table.Cell>
                  <Table.Cell><Badge variant="secondary">{incident.status}</Badge></Table.Cell>
                  <Table.Cell>
                    <Badge class={severityBadgeClass(incident.severity)}>{incident.severity}</Badge>
                  </Table.Cell>
                  <Table.Cell>{incident.facilityName}</Table.Cell>
                  <Table.Cell>{incident.responsibleLead ?? 'Unassigned'}</Table.Cell>
                  <Table.Cell>{incident.commsLead ?? '-'}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">
                    {new Date(incident.declaredAt).toLocaleString()}
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <Separator class="opacity-50" />
</section>
