<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import Plus from '@lucide/svelte/icons/plus';
  import * as Dialog from '$lib/components/ui/dialog';
  import type { ActionData, PageData } from './$types';
  import * as Alert from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import * as Table from '$lib/components/ui/table';
  import { Textarea } from '$lib/components/ui/textarea';

  export let data: PageData;
  export let form: ActionData | null = null;

  const severities = ['SEV1', 'SEV2', 'SEV3'] as const;
  const statuses = ['DECLARED', 'INVESTIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED'] as const;

  let dialogOpen = false;
  let title = '';
  let declareSeverity: (typeof severities)[number] = 'SEV2';
  let facilityId = data.facilities[0]?.id ?? '';
  let areaId = '';
  let assetIds: string[] = [];
  let description = '';
  let assignedToMemberId = data.members[0]?.id ?? '';
  let commsLeadMemberId = '';
  let filterStatus = data.filters.status[0] ?? '';
  let filterSeverity = data.filters.severity[0] ?? '';
  let filterFacilityId = data.filters.facilityId;
  let filterAreaId = data.filters.areaId;
  let filterDateFrom = data.filters.dateFrom;
  let filterDateTo = data.filters.dateTo;
  let incidents = data.incidents;
  let availableAssets: { id: string; name: string; areaId: string }[] = [];
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function memberLabel(memberId: string): string {
    const member = data.members.find((candidate) => candidate.id === memberId);
    return member ? `${member.name} (${member.role})` : 'Select member';
  }

  function facilityLabel(selectedId: string): string {
    return data.facilities.find((facility) => facility.id === selectedId)?.name ?? 'Select facility';
  }

  function areaLabel(selectedId: string): string {
    return data.areas.find((area) => area.id === selectedId)?.name ?? 'None';
  }

  $: availableAssets = areaId
    ? data.assets.filter((asset) => asset.areaId === areaId)
    : [];

  $: if (areaId) {
    assetIds = assetIds.filter((assetId) => availableAssets.some((asset) => asset.id === assetId));
  } else if (assetIds.length > 0) {
    assetIds = [];
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

  function buildFilterQuery(): string {
    const params = new URLSearchParams();

    if (filterStatus) {
      params.append('status', filterStatus);
    }
    if (filterSeverity) {
      params.append('severity', filterSeverity);
    }
    if (filterFacilityId) {
      params.append('facilityId', filterFacilityId);
    }
    if (filterAreaId) {
      params.append('areaId', filterAreaId);
    }
    if (filterDateFrom) {
      params.append('dateFrom', filterDateFrom);
    }
    if (filterDateTo) {
      params.append('dateTo', filterDateTo);
    }

    return params.toString();
  }

  async function refreshIncidents(): Promise<void> {
    const query = buildFilterQuery();
    const response = await fetch(`/api/incidents${query ? `?${query}` : ''}`);
    if (!response.ok) {
      return;
    }

    const body = (await response.json()) as {
      incidents: typeof data.incidents;
    };
    incidents = body.incidents;
  }

  onMount(() => {
    pollTimer = setInterval(() => {
      void refreshIncidents();
    }, 15000);
  });

  onDestroy(() => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  });
</script>

<section class="grid gap-6">
  <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
    <Card.Header>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-1">Dashboard</p>
        <Card.Title class="font-display text-2xl font-normal text-slate-900">Incidents</Card.Title>
      </div>
      <Card.Action>
        <Button size="sm" onclick={() => (dialogOpen = true)}>
          <Plus class="size-4" /> New incident
        </Button>
      </Card.Action>
    </Card.Header>

    <Card.Content>
      {#if incidents.length === 0}
        <Alert.Root class="border-warm-300 bg-warm-100/70 text-slate-800">
          <AlertTriangle />
          <Alert.Title>No incidents yet</Alert.Title>
          <Alert.Description>Declare your first incident using the button above.</Alert.Description>
        </Alert.Root>
      {:else}
        <form method="GET" class="mb-4 grid gap-3 rounded-lg border border-warm-300/80 bg-warm-100/40 p-3 lg:grid-cols-6">
          <div class="grid gap-1">
            <Label for="filter-status">Status</Label>
            <Select.Root type="single" name="status" bind:value={filterStatus}>
              <Select.Trigger id="filter-status" class="w-full justify-between">
                {filterStatus || 'All'}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="" label="All" />
                {#each statuses as status}
                  <Select.Item value={status} label={status} />
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-1">
            <Label for="filter-severity">Severity</Label>
            <Select.Root type="single" name="severity" bind:value={filterSeverity}>
              <Select.Trigger id="filter-severity" class="w-full justify-between">
                {filterSeverity || 'All'}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="" label="All" />
                {#each severities as severity}
                  <Select.Item value={severity} label={severity} />
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-1">
            <Label for="filter-facility">Facility</Label>
            <Select.Root type="single" name="facilityId" bind:value={filterFacilityId}>
              <Select.Trigger id="filter-facility" class="w-full justify-between">
                {data.facilities.find((f) => f.id === filterFacilityId)?.name ?? 'All'}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="" label="All" />
                {#each data.facilities as facility}
                  <Select.Item value={facility.id} label={facility.name} />
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-1">
            <Label for="filter-area">Area</Label>
            <Select.Root type="single" name="areaId" bind:value={filterAreaId}>
              <Select.Trigger id="filter-area" class="w-full justify-between">
                {data.areas.find((a) => a.id === filterAreaId)?.name ?? 'All'}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="" label="All" />
                {#each data.areas as area}
                  <Select.Item value={area.id} label={area.name} />
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-1">
            <Label for="filter-date-from">From</Label>
            <Input id="filter-date-from" name="dateFrom" type="date" bind:value={filterDateFrom} />
          </div>
          <div class="grid gap-1">
            <Label for="filter-date-to">To</Label>
            <Input id="filter-date-to" name="dateTo" type="date" bind:value={filterDateTo} />
          </div>
          <div class="lg:col-span-6 flex flex-wrap gap-2">
            <Button type="submit" variant="secondary">Apply filters</Button>
            <Button href="/" variant="outline">Clear</Button>
          </div>
        </form>

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
              {#each incidents as incident}
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
</section>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content class="sm:max-w-2xl">
    <Dialog.Header>
      <p class="text-xs font-semibold uppercase tracking-wider text-amber">New</p>
      <Dialog.Title class="font-display text-2xl font-normal text-slate-900">Declare Incident</Dialog.Title>
      <Dialog.Description class="text-slate-600">Fill in the details below to open a new incident.</Dialog.Description>
    </Dialog.Header>

    {#if form?.error}
      <Alert.Root variant="destructive" class="bg-red-50/70">
        <AlertTriangle />
        <Alert.Title>Unable to declare incident</Alert.Title>
        <Alert.Description>Check the form values and try again.</Alert.Description>
      </Alert.Root>
    {/if}

    <form method="POST" action="?/declare" class="grid gap-4 sm:grid-cols-2">
      <div class="grid gap-2 sm:col-span-2">
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

      <div class="grid gap-2 sm:col-span-2">
        <Label for="incident-description">Description (optional)</Label>
        <Textarea
          id="incident-description"
          name="description"
          bind:value={description}
          placeholder="What happened and what is currently impacted?"
        />
      </div>

      <p class="text-xs font-semibold uppercase tracking-wider text-amber sm:col-span-2">Location</p>

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
        <Label for="incident-area">Area (optional)</Label>
        <Select.Root type="single" name="areaId" bind:value={areaId}>
          <Select.Trigger id="incident-area" class="w-full justify-between">
            {areaLabel(areaId)}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="" label="None" />
            {#each data.areas as area}
              <Select.Item value={area.id} label={area.name} />
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="grid gap-2 sm:col-span-2">
        <Label>Assets (optional)</Label>
        {#if !areaId}
          <p class="text-sm text-muted-foreground">Select an area first</p>
        {:else if availableAssets.length === 0}
          <p class="text-sm text-muted-foreground">No assets in selected area</p>
        {:else}
          <div class="grid gap-1.5 rounded-md border border-warm-300/80 bg-warm-white/80 p-3 max-h-40 overflow-y-auto">
            {#each availableAssets as asset}
              <label class="flex items-center gap-2 text-sm cursor-pointer hover:text-slate-900">
                <input
                  type="checkbox"
                  name="assetIds"
                  value={asset.id}
                  checked={assetIds.includes(asset.id)}
                  on:change={(e) => {
                    if (e.currentTarget.checked) {
                      assetIds = [...assetIds, asset.id];
                    } else {
                      assetIds = assetIds.filter((id) => id !== asset.id);
                    }
                  }}
                  class="size-4 rounded border-warm-300 accent-amber"
                />
                {asset.name}
              </label>
            {/each}
          </div>
        {/if}
      </div>

      <p class="text-xs font-semibold uppercase tracking-wider text-amber sm:col-span-2">Assignment</p>

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

      <Dialog.Footer class="sm:col-span-2">
        <Button type="submit" class="w-full sm:w-auto">Declare Incident</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
