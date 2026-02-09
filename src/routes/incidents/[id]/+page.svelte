<script lang="ts">
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Info from '@lucide/svelte/icons/info';
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
  import { Textarea } from '$lib/components/ui/textarea';

  export let data: PageData;
  export let form: ActionData | null = null;

  const incidentStatuses = ['DECLARED', 'INVESTIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED'] as const;
  const incidentSeverities = ['SEV1', 'SEV2', 'SEV3'] as const;
  const followUpStatuses = ['OPEN', 'IN_PROGRESS', 'DONE'] as const;

  let statusValue: (typeof incidentStatuses)[number] = data.incident.status as (typeof incidentStatuses)[number];
  let severityValue: (typeof incidentSeverities)[number] = data.incident
    .severity as (typeof incidentSeverities)[number];
  let responsibleMemberId = data.incident.responsibleLeadMemberId ?? data.members[0]?.id ?? '';
  let commsMemberId = data.incident.commsLeadMemberId ?? data.members[0]?.id ?? '';

  let whatHappened = data.summary?.whatHappened ?? '';
  let rootCause = data.summary?.rootCause ?? '';
  let resolution = data.summary?.resolution ?? '';
  const initialDuration =
    typeof data.summary?.impact?.['durationMinutes'] === 'number'
      ? String(data.summary.impact['durationMinutes'])
      : '';
  let impactDurationMinutes = initialDuration;
  let resolveFollowUpsInput = '';
  let followUpsInput = '';
  const canEditSummary = data.incident.status === 'RESOLVED' || data.incident.status === 'CLOSED';

  function memberLabel(memberId: string): string {
    const member = data.members.find((candidate) => candidate.id === memberId);
    return member ? `${member.name} (${member.role})` : 'Select member';
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
  <div class="flex flex-wrap items-center justify-between gap-3">
    <Button href="/" variant="outline">
      <ArrowLeft class="size-4" />
      Back to dashboard
    </Button>
  </div>

  <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
    <Card.Header>
      <Card.Title class="text-3xl text-slate-900">{data.incident.title}</Card.Title>
      <Card.Description class="text-slate-600">
        Declared {new Date(data.incident.declaredAt).toLocaleString()} at {data.incident.facilityName}
      </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-4">
      {#if form?.error}
        <Alert.Root variant="destructive" class="bg-red-50/70">
          <AlertTriangle />
          <Alert.Title>Action failed</Alert.Title>
          <Alert.Description>We could not apply that update. Review the form and try again.</Alert.Description>
        </Alert.Root>
      {/if}

      <div class="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{data.incident.status}</Badge>
        <Badge class={severityBadgeClass(data.incident.severity)}>{data.incident.severity}</Badge>
        <Badge variant="outline">Facility: {data.incident.facilityName}</Badge>
        <Badge variant="outline">Responsible: {data.incident.responsibleLead ?? 'Unassigned'}</Badge>
        <Badge variant="outline">Comms: {data.incident.commsLead ?? 'None'}</Badge>
      </div>

      <div class="grid gap-3 text-sm text-muted-foreground lg:grid-cols-2">
        <p><strong class="text-foreground">Incident channel:</strong> {data.incident.chatChannelRef}</p>
        <p><strong class="text-foreground">Global channel:</strong> {data.incident.globalChannelRef ?? 'N/A'}</p>
      </div>
    </Card.Content>
  </Card.Root>

  <div class="grid gap-6 xl:grid-cols-2">
    <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
      <Card.Header>
        <Card.Title class="text-2xl text-slate-900">Live Controls</Card.Title>
        <Card.Description class="text-slate-600">Manage active workflow roles and escalation state.</Card.Description>
      </Card.Header>

      <Card.Content class="space-y-5">
        <form method="POST" action="?/status" class="grid gap-2">
          <Label for="status-select">Status</Label>
          <Select.Root type="single" name="status" bind:value={statusValue}>
            <Select.Trigger id="status-select" class="w-full justify-between">{statusValue}</Select.Trigger>
            <Select.Content>
              {#each incidentStatuses as status}
                <Select.Item value={status} label={status} />
              {/each}
            </Select.Content>
          </Select.Root>
          <Button type="submit" class="w-full sm:w-auto">Update status</Button>
        </form>

        <Separator />

        <form method="POST" action="?/severity" class="grid gap-2">
          <Label for="severity-select">Severity</Label>
          <Select.Root type="single" name="severity" bind:value={severityValue}>
            <Select.Trigger id="severity-select" class="w-full justify-between">{severityValue}</Select.Trigger>
            <Select.Content>
              {#each incidentSeverities as severity}
                <Select.Item value={severity} label={severity} />
              {/each}
            </Select.Content>
          </Select.Root>
          <Button type="submit" class="w-full sm:w-auto">Update severity</Button>
        </form>

        <Separator />

        <form method="POST" action="?/assign" class="grid gap-2">
          <Label for="responsible-select">Assign Responsible Lead</Label>
          <Select.Root type="single" name="memberId" bind:value={responsibleMemberId}>
            <Select.Trigger id="responsible-select" class="w-full justify-between">
              {memberLabel(responsibleMemberId)}
            </Select.Trigger>
            <Select.Content>
              {#each data.members as member}
                <Select.Item value={member.id} label={`${member.name} (${member.role})`} />
              {/each}
            </Select.Content>
          </Select.Root>
          <Button type="submit" class="w-full sm:w-auto">Assign responsible</Button>
        </form>

        <Separator />

        <form method="POST" action="?/assignComms" class="grid gap-2">
          <Label for="comms-select">Assign Comms Lead</Label>
          <Select.Root type="single" name="memberId" bind:value={commsMemberId}>
            <Select.Trigger id="comms-select" class="w-full justify-between">{memberLabel(commsMemberId)}</Select.Trigger>
            <Select.Content>
              {#each data.members as member}
                <Select.Item value={member.id} label={`${member.name} (${member.role})`} />
              {/each}
            </Select.Content>
          </Select.Root>
          <Button type="submit" class="w-full sm:w-auto">Assign comms</Button>
        </form>

        <Separator />

        <form method="POST" action="?/ack">
          <Button type="submit" variant="secondary" class="w-full sm:w-auto">Acknowledge escalation</Button>
        </form>
      </Card.Content>
    </Card.Root>

    <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
      <Card.Header>
        <Card.Title class="text-2xl text-slate-900">Resolve and Close</Card.Title>
        <Card.Description class="text-slate-600">
          Capture summary context before closing and generating follow-ups.
        </Card.Description>
      </Card.Header>

      <Card.Content class="space-y-6">
        <form method="POST" action="?/resolve" class="grid gap-3">
          <div class="grid gap-2">
            <Label for="what-happened">What happened</Label>
            <Textarea id="what-happened" name="whatHappened" bind:value={whatHappened} required />
          </div>

          <div class="grid gap-2">
            <Label for="root-cause">Root cause</Label>
            <Textarea id="root-cause" name="rootCause" bind:value={rootCause} required />
          </div>

          <div class="grid gap-2">
            <Label for="resolution">Resolution</Label>
            <Textarea id="resolution" name="resolution" bind:value={resolution} required />
          </div>

          <div class="grid gap-2">
            <Label for="impact-duration">Impact duration (minutes)</Label>
            <Input
              id="impact-duration"
              name="impactDurationMinutes"
              bind:value={impactDurationMinutes}
              inputmode="numeric"
              placeholder="45"
            />
          </div>

          <div class="grid gap-2">
            <Label for="resolve-follow-ups">Follow-up tasks (one per line)</Label>
            <Textarea id="resolve-follow-ups" name="resolveFollowUps" bind:value={resolveFollowUpsInput} />
          </div>

          <Button type="submit" class="w-full sm:w-auto">Mark resolved</Button>
        </form>

        <Separator />

        <form method="POST" action="?/close" class="grid gap-3">
          <div class="grid gap-2">
            <Label for="follow-ups">Follow-up tasks (one per line)</Label>
            <Textarea id="follow-ups" name="followUps" bind:value={followUpsInput} />
          </div>
          <Button type="submit" variant="secondary" class="w-full sm:w-auto">Close incident</Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>

  <div class="grid gap-6 xl:grid-cols-2">
    <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
      <Card.Header>
        <Card.Title class="text-2xl text-slate-900">Summary</Card.Title>
      </Card.Header>

      <Card.Content>
        {#if data.summary}
          <div class="grid gap-4 text-sm leading-relaxed">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">What happened</p>
              <p>{data.summary.whatHappened}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Root cause</p>
              <p>{data.summary.rootCause}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Resolution</p>
              <p>{data.summary.resolution}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact</p>
              <p>{JSON.stringify(data.summary.impact)}</p>
            </div>
          </div>

          {#if canEditSummary}
            <Separator class="my-4" />
            <form method="POST" action="?/summary" class="grid gap-3">
              <div class="grid gap-2">
                <Label for="summary-what-happened">What happened</Label>
                <Textarea id="summary-what-happened" name="whatHappened" bind:value={whatHappened} required />
              </div>
              <div class="grid gap-2">
                <Label for="summary-root-cause">Root cause</Label>
                <Textarea id="summary-root-cause" name="rootCause" bind:value={rootCause} required />
              </div>
              <div class="grid gap-2">
                <Label for="summary-resolution">Resolution</Label>
                <Textarea id="summary-resolution" name="resolution" bind:value={resolution} required />
              </div>
              <div class="grid gap-2">
                <Label for="summary-impact-duration">Impact duration (minutes)</Label>
                <Input
                  id="summary-impact-duration"
                  name="impactDurationMinutes"
                  bind:value={impactDurationMinutes}
                  inputmode="numeric"
                  placeholder="45"
                />
              </div>
              <Button type="submit" variant="outline" class="w-full sm:w-auto">Save summary edits</Button>
            </form>
          {/if}
        {:else}
          <Alert.Root class="border-warm-300 bg-warm-100/70 text-slate-800">
            <Info />
            <Alert.Title>No summary yet</Alert.Title>
            <Alert.Description>Resolve the incident to capture the structured summary.</Alert.Description>
          </Alert.Root>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
      <Card.Header>
        <Card.Title class="text-2xl text-slate-900">Follow-ups</Card.Title>
      </Card.Header>

      <Card.Content>
        {#if data.followUps.length === 0}
          <Alert.Root class="border-warm-300 bg-warm-100/70 text-slate-800">
            <Info />
            <Alert.Title>No follow-ups</Alert.Title>
            <Alert.Description>Add tasks when closing the incident.</Alert.Description>
          </Alert.Root>
        {:else}
          <div class="space-y-3">
            {#each data.followUps as followUp}
              <div class="rounded-lg border border-warm-300/80 bg-warm-white/80 p-3">
                <p class="font-medium text-slate-900">{followUp.description}</p>

                <form method="POST" action="?/followupStatus" class="mt-3 flex flex-wrap items-center gap-2">
                  <Input type="hidden" name="id" value={followUp.id} />
                  <select
                    class="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-w-44 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    name="status"
                  >
                    {#each followUpStatuses as statusOption}
                      <option value={statusOption} selected={followUp.status === statusOption}>
                        {statusOption}
                      </option>
                    {/each}
                  </select>
                  <Button type="submit" variant="outline">Save</Button>
                </form>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
    <Card.Header>
      <Card.Title class="text-2xl text-slate-900">Escalation Targets</Card.Title>
      <Card.Description class="text-slate-600">
        Per-step notification and acknowledgement state.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if data.escalationTargets.length === 0}
        <Alert.Root class="border-warm-300 bg-warm-100/70 text-slate-800">
          <Info />
          <Alert.Title>No escalation targets yet</Alert.Title>
          <Alert.Description>Targets will appear after escalation steps execute.</Alert.Description>
        </Alert.Root>
      {:else}
        <div class="overflow-x-auto rounded-lg border border-warm-300/80">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Step</Table.Head>
                <Table.Head>Target</Table.Head>
                <Table.Head>Notify type</Table.Head>
                <Table.Head>Notified</Table.Head>
                <Table.Head>Acknowledged</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each data.escalationTargets as target}
                <Table.Row>
                  <Table.Cell>#{target.stepOrder}</Table.Cell>
                  <Table.Cell>{target.targetMemberName ?? target.targetMemberId}</Table.Cell>
                  <Table.Cell>{target.notifyType}</Table.Cell>
                  <Table.Cell>{new Date(target.notifiedAt).toLocaleString()}</Table.Cell>
                  <Table.Cell>{target.acknowledgedAt ? new Date(target.acknowledgedAt).toLocaleString() : 'Pending'}</Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
    <Card.Header>
      <Card.Title class="text-2xl text-slate-900">Timeline</Card.Title>
      <Card.Description class="text-slate-600">Append-only event stream for this incident.</Card.Description>
    </Card.Header>

    <Card.Content>
      <div class="space-y-3">
        {#each data.events as event}
          <article class="rounded-lg border border-warm-300/80 bg-warm-white/80 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-semibold text-slate-900">#{event.sequence} {event.eventType}</p>
              <p class="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
            </div>
            <pre class="mt-3 overflow-x-auto rounded-md border border-warm-300/80 bg-slate-900 p-3 text-xs text-warm-white">{JSON.stringify(
                event.payload,
                null,
                2
              )}</pre>
          </article>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>
</section>
