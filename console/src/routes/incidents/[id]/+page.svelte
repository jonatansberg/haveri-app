<script lang="ts">
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Check from '@lucide/svelte/icons/check';
  import Info from '@lucide/svelte/icons/info';
  import Pencil from '@lucide/svelte/icons/pencil';
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
  let editingSummary = false;
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

  function formatEventPayload(eventType: string, payload: Record<string, unknown>): string {
    switch (eventType) {
      case 'declared':
        return `Incident declared with severity ${payload['severity'] ?? 'unknown'}`;
      case 'status_change':
        return `Status changed from ${payload['from'] ?? '?'} to ${payload['to'] ?? '?'}`;
      case 'severity_change':
        return `Severity changed from ${payload['from'] ?? '?'} to ${payload['to'] ?? '?'}`;
      case 'assignment':
        return `Responsible lead assigned`;
      case 'comms_assignment':
        return `Comms lead assigned`;
      case 'resolved':
        return 'Incident marked as resolved';
      case 'closed':
        return `Incident closed${typeof payload['followUpCount'] === 'number' ? ` with ${payload['followUpCount']} follow-up${payload['followUpCount'] === 1 ? '' : 's'}` : ''}`;
      case 'escalation':
        return `Escalation ${payload['action'] === 'acknowledged' ? 'acknowledged' : `step ${payload['stepOrder'] ?? '?'} triggered`}`;
      case 'follow_up_created':
        return `Follow-up created: ${payload['description'] ?? ''}`;
      case 'annotation':
        return String(payload['text'] ?? payload['field'] ?? 'Summary updated');
      case 'triage_response':
        return `Triage: severity ${payload['fromSeverity'] ?? '?'} → ${payload['toSeverity'] ?? '?'}`;
      default:
        return '';
    }
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
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-1">Incident</p>
        <Card.Title class="font-display text-2xl font-normal text-slate-900">{data.incident.title}</Card.Title>
      </div>
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
        <Card.Title class="font-display text-2xl font-normal text-slate-900">Live Controls</Card.Title>
        <Card.Description class="text-slate-600">Manage active workflow roles and escalation state.</Card.Description>
      </Card.Header>

      <Card.Content class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <form method="POST" action="?/status" class="grid gap-1.5">
            <Label for="status-select" class="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</Label>
            <div class="flex gap-2">
              <Select.Root type="single" name="status" bind:value={statusValue}>
                <Select.Trigger id="status-select" class="flex-1 justify-between">{statusValue}</Select.Trigger>
                <Select.Content>
                  {#each incidentStatuses as status}
                    <Select.Item value={status} label={status} />
                  {/each}
                </Select.Content>
              </Select.Root>
              <Button type="submit" size="icon" variant="secondary">
                <Check class="size-4" />
              </Button>
            </div>
          </form>

          <form method="POST" action="?/severity" class="grid gap-1.5">
            <Label for="severity-select" class="text-xs font-semibold uppercase tracking-wider text-slate-500">Severity</Label>
            <div class="flex gap-2">
              <Select.Root type="single" name="severity" bind:value={severityValue}>
                <Select.Trigger id="severity-select" class="flex-1 justify-between">{severityValue}</Select.Trigger>
                <Select.Content>
                  {#each incidentSeverities as severity}
                    <Select.Item value={severity} label={severity} />
                  {/each}
                </Select.Content>
              </Select.Root>
              <Button type="submit" size="icon" variant="secondary">
                <Check class="size-4" />
              </Button>
            </div>
          </form>

          <form method="POST" action="?/assign" class="grid gap-1.5">
            <Label for="responsible-select" class="text-xs font-semibold uppercase tracking-wider text-slate-500">Responsible Lead</Label>
            <div class="flex gap-2">
              <Select.Root type="single" name="memberId" bind:value={responsibleMemberId}>
                <Select.Trigger id="responsible-select" class="flex-1 justify-between">
                  {memberLabel(responsibleMemberId)}
                </Select.Trigger>
                <Select.Content>
                  {#each data.members as member}
                    <Select.Item value={member.id} label={`${member.name} (${member.role})`} />
                  {/each}
                </Select.Content>
              </Select.Root>
              <Button type="submit" size="icon" variant="secondary">
                <Check class="size-4" />
              </Button>
            </div>
          </form>

          <form method="POST" action="?/assignComms" class="grid gap-1.5">
            <Label for="comms-select" class="text-xs font-semibold uppercase tracking-wider text-slate-500">Comms Lead</Label>
            <div class="flex gap-2">
              <Select.Root type="single" name="memberId" bind:value={commsMemberId}>
                <Select.Trigger id="comms-select" class="flex-1 justify-between">{memberLabel(commsMemberId)}</Select.Trigger>
                <Select.Content>
                  {#each data.members as member}
                    <Select.Item value={member.id} label={`${member.name} (${member.role})`} />
                  {/each}
                </Select.Content>
              </Select.Root>
              <Button type="submit" size="icon" variant="secondary">
                <Check class="size-4" />
              </Button>
            </div>
          </form>
        </div>

        <Separator />

        <form method="POST" action="?/ack">
          <Button type="submit" variant="secondary" class="w-full">Acknowledge escalation</Button>
        </form>
      </Card.Content>
    </Card.Root>

    <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
      <Card.Header>
        <Card.Title class="font-display text-2xl font-normal text-slate-900">Resolve Incident</Card.Title>
        <Card.Description class="text-slate-600">
          Record what happened, why, and how it was fixed.
        </Card.Description>
      </Card.Header>

      <Card.Content class="space-y-4">
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
      </Card.Content>
    </Card.Root>
  </div>

  {#if data.incident.status === 'RESOLVED'}
    <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
      <Card.Header>
        <Card.Title class="font-display text-2xl font-normal text-slate-900">Close Incident</Card.Title>
        <Card.Description class="text-slate-600">
          Add final follow-up tasks and close the incident record.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form method="POST" action="?/close" class="grid gap-3">
          <div class="grid gap-2">
            <Label for="follow-ups">Follow-up tasks (one per line)</Label>
            <Textarea id="follow-ups" name="followUps" bind:value={followUpsInput} />
          </div>
          <Button type="submit" variant="secondary" class="w-full sm:w-auto">Close incident</Button>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="grid gap-6 xl:grid-cols-2">
    <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
      <Card.Header>
        <Card.Title class="font-display text-2xl font-normal text-slate-900">Summary</Card.Title>
        {#if canEditSummary && data.summary}
          <Card.Action>
            <Button variant="ghost" size="icon-sm" onclick={() => (editingSummary = !editingSummary)}>
              <Pencil class="size-4" />
            </Button>
          </Card.Action>
        {/if}
      </Card.Header>

      <Card.Content>
        {#if data.summary && !editingSummary}
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
              {#if data.summary.impact?.['durationMinutes'] !== undefined}
                <p>{data.summary.impact['durationMinutes']} minutes of impact</p>
              {:else}
                <p class="text-muted-foreground">No impact data recorded</p>
              {/if}
            </div>
          </div>
        {:else if data.summary && editingSummary}
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
            <div class="flex gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="outline" onclick={() => (editingSummary = false)}>Cancel</Button>
            </div>
          </form>
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
        <Card.Title class="font-display text-2xl font-normal text-slate-900">Follow-ups</Card.Title>
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
                  <Select.Root type="single" name="status" value={followUp.status}>
                    <Select.Trigger class="min-w-36 justify-between">{followUp.status}</Select.Trigger>
                    <Select.Content>
                      {#each followUpStatuses as statusOption}
                        <Select.Item value={statusOption} label={statusOption} />
                      {/each}
                    </Select.Content>
                  </Select.Root>
                  <Button type="submit" variant="outline" size="sm">Save</Button>
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
      <Card.Title class="font-display text-2xl font-normal text-slate-900">Escalation Targets</Card.Title>
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
      <Card.Title class="font-display text-2xl font-normal text-slate-900">Timeline</Card.Title>
      <Card.Description class="text-slate-600">Event stream for this incident.</Card.Description>
    </Card.Header>

    <Card.Content>
      <div class="space-y-3">
        {#each data.events as event}
          <article class="rounded-lg border border-warm-300/80 bg-warm-white/80 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <Badge variant="secondary" class="text-xs">{event.eventType.replace(/_/g, ' ')}</Badge>
                <span class="text-xs text-muted-foreground">#{event.sequence}</span>
              </div>
              <p class="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
            </div>
            {#if formatEventPayload(event.eventType, event.payload)}
              <p class="mt-2 text-sm text-slate-700">{formatEventPayload(event.eventType, event.payload)}</p>
            {:else}
              <details class="mt-2">
                <summary class="text-xs text-muted-foreground cursor-pointer hover:text-slate-700">Show raw payload</summary>
                <pre class="mt-1 overflow-x-auto rounded-md border border-warm-300/80 bg-slate-900 p-3 text-xs text-warm-white">{JSON.stringify(event.payload, null, 2)}</pre>
              </details>
            {/if}
          </article>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>
</section>
