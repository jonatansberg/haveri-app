<script lang="ts">
  import { Switch } from 'bits-ui';
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import type { ActionData, PageData } from './$types';
  import * as Alert from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import * as Table from '$lib/components/ui/table';

  export let data: PageData;
  export let form: ActionData | null = null;

  let editingFacilityId: string | null = null;
  let addingFacility = false;
  let editingAreaId: string | null = null;
  let addingArea = false;
  let editingAssetId: string | null = null;
  let addingAsset = false;
  let editingTeamId: string | null = null;
  let addingTeam = false;
  let editingPolicyId: string | null = null;
  let addingPolicy = false;
  let deletingId: string | null = null;
  let deletingSection: string | null = null;

  type ConditionState = {
    severities: string[];
    areas: string;
    timeWindowFrom: string;
    timeWindowTo: string;
  };

  type StepState = {
    delayMinutes: number;
    notifyType: string;
    notifyTargetIds: string[];
    ifUnacked: boolean;
  };

  let newPolicyName = '';
  let newPolicyFacilityId = '';
  let newPolicyActive = true;
  let newPolicyConditions: ConditionState = { severities: [], areas: '', timeWindowFrom: '', timeWindowTo: '' };
  let newPolicySteps: StepState[] = [{ delayMinutes: 0, notifyType: 'team', notifyTargetIds: [], ifUnacked: true }];

  let editPolicyConditions: ConditionState = { severities: [], areas: '', timeWindowFrom: '', timeWindowTo: '' };
  let editPolicySteps: StepState[] = [];
  let editPolicyActive = true;

  let orderedPolicies = [...data.routingPolicies];
  $: orderedPolicies = [...data.routingPolicies];

  function memberIdsForTeam(teamId: string): string[] {
    return data.memberships
      .filter((membership) => membership.teamId === teamId)
      .map((membership) => membership.memberId);
  }

  function buildConditionsJson(cond: ConditionState): string {
    const obj: Record<string, unknown> = {};
    if (cond.severities.length > 0) obj['severity'] = cond.severities;
    if (cond.areas.trim()) obj['area'] = cond.areas.split(',').map((s) => s.trim()).filter(Boolean);
    if (cond.timeWindowFrom && cond.timeWindowTo) obj['timeWindow'] = [`${cond.timeWindowFrom}-${cond.timeWindowTo}`];
    return JSON.stringify(obj);
  }

  function buildStepsJson(steps: StepState[]): string {
    return JSON.stringify(steps.map((s) => ({
      delayMinutes: s.delayMinutes,
      notifyType: s.notifyType,
      notifyTargetIds: s.notifyTargetIds,
      ifUnacked: s.ifUnacked
    })));
  }

  function parseConditions(policy: typeof data.routingPolicies[0]): ConditionState {
    const cond = policy.conditions ?? {};
    const tw = (cond.timeWindow ?? [])[0] ?? '';
    const parts = tw.split('-');
    return {
      severities: cond.severity ?? [],
      areas: (cond.area ?? []).join(', '),
      timeWindowFrom: parts[0] ?? '',
      timeWindowTo: parts[1] ?? ''
    };
  }

  function parseSteps(policy: typeof data.routingPolicies[0]): StepState[] {
    return policy.steps.map((s) => ({
      delayMinutes: s.delayMinutes,
      notifyType: s.notifyType,
      notifyTargetIds: s.notifyTargetIds,
      ifUnacked: s.ifUnacked
    }));
  }

  function startEditPolicy(policy: typeof data.routingPolicies[0]): void {
    editingPolicyId = policy.id;
    editPolicyConditions = parseConditions(policy);
    editPolicySteps = parseSteps(policy);
    editPolicyActive = policy.isActive;
  }

  function addStep(steps: StepState[]): StepState[] {
    return [...steps, { delayMinutes: 0, notifyType: 'team', notifyTargetIds: [], ifUnacked: true }];
  }

  function removeStep(steps: StepState[], index: number): StepState[] {
    return steps.filter((_, i) => i !== index);
  }

  function movePolicy(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= orderedPolicies.length) return;
    const copy = [...orderedPolicies];
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
    orderedPolicies = copy;
  }

  function startDelete(id: string, section: string): void {
    deletingId = id;
    deletingSection = section;
  }

  function cancelDelete(): void {
    deletingId = null;
    deletingSection = null;
  }
</script>

<div class="flex gap-8">
  <nav class="sticky top-20 hidden w-48 shrink-0 self-start lg:block">
    <ul class="grid gap-1">
      {#each [
        { id: 'organization', label: 'Organization' },
        { id: 'facilities', label: 'Facilities' },
        { id: 'areas', label: 'Areas' },
        { id: 'assets', label: 'Assets' },
        { id: 'teams', label: 'Teams' },
        { id: 'routing', label: 'Routing' }
      ] as link}
        <li>
          <a
            href="#{link.id}"
            class="block rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 hover:bg-warm-100"
          >
            {link.label}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="min-w-0 flex-1 rounded-xl border border-warm-300/80 bg-card/95 px-6 py-8 shadow-sm lg:px-8">
    <div class="mb-8">
      <p class="text-xs font-semibold uppercase tracking-wider text-amber">Configuration</p>
      <h1 class="font-display text-3xl font-normal text-slate-900 mt-1">Settings</h1>
    </div>

    {#if form?.error}
      <Alert.Root variant="destructive" class="bg-red-50/70 mb-6">
        <AlertTriangle />
        <Alert.Title>Something went wrong</Alert.Title>
        <Alert.Description>
          {#if typeof form.error === 'string'}
            {form.error}
          {:else}
            Please check your input and try again.
          {/if}
        </Alert.Description>
      </Alert.Root>
    {/if}

    <!-- Organization -->
    <section id="organization" class="pb-8 border-b border-warm-200">
      <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-1">General</p>
      <h2 class="font-display text-2xl font-normal text-slate-900">Organization</h2>
      <p class="text-sm text-muted-foreground mt-1 mb-4">Name and slug for your organization.</p>

      <form method="POST" action="?/updateOrganization" class="grid gap-3 md:grid-cols-3">
        <div class="grid gap-2">
          <Label for="org-name">Name</Label>
          <Input id="org-name" name="name" value={data.organization?.name ?? ''} required />
        </div>
        <div class="grid gap-2">
          <Label for="org-slug">Slug</Label>
          <Input id="org-slug" name="slug" value={data.organization?.slug ?? ''} required />
        </div>
        <div class="flex items-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </section>

    <!-- Facilities -->
    <section id="facilities" class="py-8 border-b border-warm-200">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-1">Locations</p>
          <h2 class="font-display text-2xl font-normal text-slate-900">Facilities</h2>
        </div>
        <Button variant={addingFacility ? 'outline' : 'default'} size="sm" onclick={() => { addingFacility = !addingFacility; editingFacilityId = null; }}>
          {#if addingFacility}<X class="size-4" /> Cancel{:else}<Plus class="size-4" /> Add{/if}
        </Button>
      </div>

      {#if addingFacility}
        <form method="POST" action="?/createFacility" class="mb-4 grid gap-3 rounded-lg border border-warm-300/80 bg-warm-100/40 p-4 md:grid-cols-3">
          <div class="grid gap-2">
            <Label>Name</Label>
            <Input name="name" placeholder="Stockholm Plant" required />
          </div>
          <div class="grid gap-2">
            <Label>Timezone</Label>
            <Input name="timezone" placeholder="Europe/Stockholm" required />
          </div>
          <div class="flex items-end">
            <Button type="submit">Add facility</Button>
          </div>
        </form>
      {/if}

      {#if data.facilities.length > 0}
        <div class="overflow-x-auto rounded-lg border border-warm-300/80">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Timezone</Table.Head>
                <Table.Head class="w-24">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each data.facilities as facility}
                <Table.Row>
                  <Table.Cell class="font-medium">{facility.name}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">{facility.timezone}</Table.Cell>
                  <Table.Cell>
                    <div class="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onclick={() => { editingFacilityId = editingFacilityId === facility.id ? null : facility.id; addingFacility = false; }}>
                        <Pencil class="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onclick={() => startDelete(facility.id, 'facility')}>
                        <Trash2 class="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
                {#if editingFacilityId === facility.id}
                  <Table.Row>
                    <Table.Cell colspan={3}>
                      <form method="POST" action="?/updateFacility" class="grid gap-3 p-2 md:grid-cols-3">
                        <input type="hidden" name="id" value={facility.id} />
                        <div class="grid gap-2">
                          <Label>Name</Label>
                          <Input name="name" value={facility.name} required />
                        </div>
                        <div class="grid gap-2">
                          <Label>Timezone</Label>
                          <Input name="timezone" value={facility.timezone} required />
                        </div>
                        <div class="flex items-end gap-2">
                          <Button type="submit" variant="secondary">Save</Button>
                          <Button type="button" variant="outline" onclick={() => (editingFacilityId = null)}>Cancel</Button>
                        </div>
                      </form>
                    </Table.Cell>
                  </Table.Row>
                {/if}
                {#if deletingId === facility.id && deletingSection === 'facility'}
                  <Table.Row>
                    <Table.Cell colspan={3}>
                      <form method="POST" action="?/deleteFacility" class="flex items-center gap-3 p-2">
                        <input type="hidden" name="id" value={facility.id} />
                        <p class="text-sm text-destructive">Delete this facility?</p>
                        <Button type="submit" variant="destructive" size="sm">Confirm</Button>
                        <Button type="button" variant="outline" size="sm" onclick={cancelDelete}>Cancel</Button>
                      </form>
                    </Table.Cell>
                  </Table.Row>
                {/if}
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">No facilities yet. Add one to get started.</p>
      {/if}
    </section>

    <!-- Areas -->
    <section id="areas" class="py-8 border-b border-warm-200">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-1">Locations</p>
          <h2 class="font-display text-2xl font-normal text-slate-900">Areas</h2>
        </div>
        <Button variant={addingArea ? 'outline' : 'default'} size="sm" onclick={() => { addingArea = !addingArea; editingAreaId = null; }}>
          {#if addingArea}<X class="size-4" /> Cancel{:else}<Plus class="size-4" /> Add{/if}
        </Button>
      </div>

      {#if addingArea}
        <form method="POST" action="?/createArea" class="mb-4 grid gap-3 rounded-lg border border-warm-300/80 bg-warm-100/40 p-4 md:grid-cols-4">
          <div class="grid gap-2">
            <Label>Facility</Label>
            <Select.Root type="single" name="facilityId" value={data.facilities[0]?.id ?? ''}>
              <Select.Trigger class="w-full justify-between">{data.facilities[0]?.name ?? 'Select'}</Select.Trigger>
              <Select.Content>
                {#each data.facilities as facility}
                  <Select.Item value={facility.id} label={facility.name} />
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-2">
            <Label>Name</Label>
            <Input name="name" placeholder="Area name" required />
          </div>
          <div class="grid gap-2">
            <Label>Description</Label>
            <Input name="description" placeholder="Optional" />
          </div>
          <div class="flex items-end">
            <Button type="submit">Add area</Button>
          </div>
        </form>
      {/if}

      {#if data.areas.length > 0}
        <div class="overflow-x-auto rounded-lg border border-warm-300/80">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Facility</Table.Head>
                <Table.Head>Description</Table.Head>
                <Table.Head class="w-24">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each data.areas as area}
                <Table.Row>
                  <Table.Cell class="font-medium">{area.name}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">{data.facilities.find((f) => f.id === area.facilityId)?.name ?? '-'}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">{area.description ?? '-'}</Table.Cell>
                  <Table.Cell>
                    <div class="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onclick={() => { editingAreaId = editingAreaId === area.id ? null : area.id; addingArea = false; }}>
                        <Pencil class="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onclick={() => startDelete(area.id, 'area')}>
                        <Trash2 class="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
                {#if editingAreaId === area.id}
                  <Table.Row>
                    <Table.Cell colspan={4}>
                      <form method="POST" action="?/updateArea" class="grid gap-3 p-2 md:grid-cols-3">
                        <input type="hidden" name="id" value={area.id} />
                        <div class="grid gap-2">
                          <Label>Name</Label>
                          <Input name="name" value={area.name} required />
                        </div>
                        <div class="grid gap-2">
                          <Label>Description</Label>
                          <Input name="description" value={area.description ?? ''} />
                        </div>
                        <div class="flex items-end gap-2">
                          <Button type="submit" variant="secondary">Save</Button>
                          <Button type="button" variant="outline" onclick={() => (editingAreaId = null)}>Cancel</Button>
                        </div>
                      </form>
                    </Table.Cell>
                  </Table.Row>
                {/if}
                {#if deletingId === area.id && deletingSection === 'area'}
                  <Table.Row>
                    <Table.Cell colspan={4}>
                      <form method="POST" action="?/deleteArea" class="flex items-center gap-3 p-2">
                        <input type="hidden" name="id" value={area.id} />
                        <p class="text-sm text-destructive">Delete this area?</p>
                        <Button type="submit" variant="destructive" size="sm">Confirm</Button>
                        <Button type="button" variant="outline" size="sm" onclick={cancelDelete}>Cancel</Button>
                      </form>
                    </Table.Cell>
                  </Table.Row>
                {/if}
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">No areas yet.</p>
      {/if}
    </section>

    <!-- Assets -->
    <section id="assets" class="py-8 border-b border-warm-200">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-1">Equipment</p>
          <h2 class="font-display text-2xl font-normal text-slate-900">Assets</h2>
        </div>
        <Button variant={addingAsset ? 'outline' : 'default'} size="sm" onclick={() => { addingAsset = !addingAsset; editingAssetId = null; }}>
          {#if addingAsset}<X class="size-4" /> Cancel{:else}<Plus class="size-4" /> Add{/if}
        </Button>
      </div>

      {#if addingAsset}
        <form method="POST" action="?/createAsset" class="mb-4 grid gap-3 rounded-lg border border-warm-300/80 bg-warm-100/40 p-4 md:grid-cols-5">
          <div class="grid gap-2">
            <Label>Area</Label>
            <Select.Root type="single" name="areaId" value={data.areas[0]?.id ?? ''}>
              <Select.Trigger class="w-full justify-between">{data.areas[0]?.name ?? 'Select'}</Select.Trigger>
              <Select.Content>
                {#each data.areas as area}
                  <Select.Item value={area.id} label={area.name} />
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-2">
            <Label>Name</Label>
            <Input name="name" placeholder="Asset name" required />
          </div>
          <div class="grid gap-2">
            <Label>Type</Label>
            <Input name="assetType" placeholder="conveyor_belt" required />
          </div>
          <div class="grid gap-2">
            <Label>Metadata JSON</Label>
            <Input name="metadataJson" placeholder={'{}'} />
          </div>
          <div class="flex items-end">
            <Button type="submit">Add asset</Button>
          </div>
        </form>
      {/if}

      {#if data.assets.length > 0}
        <div class="overflow-x-auto rounded-lg border border-warm-300/80">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Area</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head class="w-24">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each data.assets as asset}
                <Table.Row>
                  <Table.Cell class="font-medium">{asset.name}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">{data.areas.find((a) => a.id === asset.areaId)?.name ?? '-'}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">{asset.assetType}</Table.Cell>
                  <Table.Cell>
                    <div class="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onclick={() => { editingAssetId = editingAssetId === asset.id ? null : asset.id; addingAsset = false; }}>
                        <Pencil class="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onclick={() => startDelete(asset.id, 'asset')}>
                        <Trash2 class="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
                {#if editingAssetId === asset.id}
                  <Table.Row>
                    <Table.Cell colspan={4}>
                      <form method="POST" action="?/updateAsset" class="grid gap-3 p-2 md:grid-cols-4">
                        <input type="hidden" name="id" value={asset.id} />
                        <div class="grid gap-2">
                          <Label>Area</Label>
                          <Select.Root type="single" name="areaId" value={asset.areaId}>
                            <Select.Trigger class="w-full justify-between">{data.areas.find((a) => a.id === asset.areaId)?.name ?? 'Select'}</Select.Trigger>
                            <Select.Content>
                              {#each data.areas as area}
                                <Select.Item value={area.id} label={area.name} />
                              {/each}
                            </Select.Content>
                          </Select.Root>
                        </div>
                        <div class="grid gap-2">
                          <Label>Name</Label>
                          <Input name="name" value={asset.name} required />
                        </div>
                        <div class="grid gap-2">
                          <Label>Type</Label>
                          <Input name="assetType" value={asset.assetType} required />
                        </div>
                        <div class="grid gap-2">
                          <Label>Metadata JSON</Label>
                          <Input name="metadataJson" value={JSON.stringify(asset.metadata ?? {})} />
                        </div>
                        <div class="flex items-end gap-2 md:col-span-4">
                          <Button type="submit" variant="secondary">Save</Button>
                          <Button type="button" variant="outline" onclick={() => (editingAssetId = null)}>Cancel</Button>
                        </div>
                      </form>
                    </Table.Cell>
                  </Table.Row>
                {/if}
                {#if deletingId === asset.id && deletingSection === 'asset'}
                  <Table.Row>
                    <Table.Cell colspan={4}>
                      <form method="POST" action="?/deleteAsset" class="flex items-center gap-3 p-2">
                        <input type="hidden" name="id" value={asset.id} />
                        <p class="text-sm text-destructive">Delete this asset?</p>
                        <Button type="submit" variant="destructive" size="sm">Confirm</Button>
                        <Button type="button" variant="outline" size="sm" onclick={cancelDelete}>Cancel</Button>
                      </form>
                    </Table.Cell>
                  </Table.Row>
                {/if}
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">No assets yet.</p>
      {/if}
    </section>

    <!-- Teams -->
    <section id="teams" class="py-8 border-b border-warm-200">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-1">People</p>
          <h2 class="font-display text-2xl font-normal text-slate-900">Teams</h2>
        </div>
        <Button variant={addingTeam ? 'outline' : 'default'} size="sm" onclick={() => { addingTeam = !addingTeam; editingTeamId = null; }}>
          {#if addingTeam}<X class="size-4" /> Cancel{:else}<Plus class="size-4" /> Add{/if}
        </Button>
      </div>

      {#if addingTeam}
        <form method="POST" action="?/createTeam" class="mb-4 grid gap-3 rounded-lg border border-warm-300/80 bg-warm-100/40 p-4 md:grid-cols-4">
          <div class="grid gap-2">
            <Label>Name</Label>
            <Input name="name" placeholder="Team name" required />
          </div>
          <div class="grid gap-2">
            <Label>Facility</Label>
            <Select.Root type="single" name="facilityId" value="">
              <Select.Trigger class="w-full justify-between">No facility</Select.Trigger>
              <Select.Content>
                <Select.Item value="" label="No facility" />
                {#each data.facilities as facility}
                  <Select.Item value={facility.id} label={facility.name} />
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-2">
            <Label>Shift schedule JSON</Label>
            <Input name="shiftInfoJson" placeholder={'{}'} />
          </div>
          <div class="flex items-end">
            <Button type="submit">Add team</Button>
          </div>
        </form>
      {/if}

      {#if data.teams.length > 0}
        <div class="overflow-x-auto rounded-lg border border-warm-300/80">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Facility</Table.Head>
                <Table.Head>Members</Table.Head>
                <Table.Head class="w-24">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each data.teams as team}
                <Table.Row>
                  <Table.Cell class="font-medium">{team.name}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">{data.facilities.find((f) => f.id === team.facilityId)?.name ?? '-'}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">
                    {memberIdsForTeam(team.id).length} member{memberIdsForTeam(team.id).length === 1 ? '' : 's'}
                  </Table.Cell>
                  <Table.Cell>
                    <div class="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onclick={() => { editingTeamId = editingTeamId === team.id ? null : team.id; addingTeam = false; }}>
                        <Pencil class="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onclick={() => startDelete(team.id, 'team')}>
                        <Trash2 class="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
                {#if editingTeamId === team.id}
                  <Table.Row>
                    <Table.Cell colspan={4}>
                      <div class="grid gap-4 p-2">
                        <form method="POST" action="?/updateTeam" class="grid gap-3 md:grid-cols-4">
                          <input type="hidden" name="id" value={team.id} />
                          <div class="grid gap-2">
                            <Label>Name</Label>
                            <Input name="name" value={team.name} required />
                          </div>
                          <div class="grid gap-2">
                            <Label>Facility</Label>
                            <Select.Root type="single" name="facilityId" value={team.facilityId ?? ''}>
                              <Select.Trigger class="w-full justify-between">{data.facilities.find((f) => f.id === team.facilityId)?.name ?? 'No facility'}</Select.Trigger>
                              <Select.Content>
                                <Select.Item value="" label="No facility" />
                                {#each data.facilities as facility}
                                  <Select.Item value={facility.id} label={facility.name} />
                                {/each}
                              </Select.Content>
                            </Select.Root>
                          </div>
                          <div class="grid gap-2">
                            <Label>Shift schedule JSON</Label>
                            <Input name="shiftInfoJson" value={JSON.stringify(team.shiftInfo ?? {})} />
                          </div>
                          <div class="flex items-end gap-2">
                            <Button type="submit" variant="secondary">Save team</Button>
                          </div>
                        </form>

                        <p class="text-xs font-semibold uppercase tracking-wider text-amber">Members</p>
                        <form method="POST" action="?/setTeamMembers" class="grid gap-2">
                          <input type="hidden" name="teamId" value={team.id} />
                          <div class="grid gap-1.5 rounded-md border border-warm-300/80 bg-warm-white/80 p-3 max-h-48 overflow-y-auto">
                            {#each data.members as member}
                              <label class="flex items-center gap-2 text-sm cursor-pointer hover:text-slate-900">
                                <input
                                  type="checkbox"
                                  name="memberIds"
                                  value={member.id}
                                  checked={memberIdsForTeam(team.id).includes(member.id)}
                                  class="size-4 rounded border-warm-300 accent-amber"
                                />
                                {member.name} <span class="text-muted-foreground">({member.role})</span>
                              </label>
                            {/each}
                          </div>
                          <div class="flex gap-2">
                            <Button type="submit" variant="outline" size="sm">Save members</Button>
                            <Button type="button" variant="outline" size="sm" onclick={() => (editingTeamId = null)}>Close</Button>
                          </div>
                        </form>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                {/if}
                {#if deletingId === team.id && deletingSection === 'team'}
                  <Table.Row>
                    <Table.Cell colspan={4}>
                      <form method="POST" action="?/deleteTeam" class="flex items-center gap-3 p-2">
                        <input type="hidden" name="id" value={team.id} />
                        <p class="text-sm text-destructive">Delete this team?</p>
                        <Button type="submit" variant="destructive" size="sm">Confirm</Button>
                        <Button type="button" variant="outline" size="sm" onclick={cancelDelete}>Cancel</Button>
                      </form>
                    </Table.Cell>
                  </Table.Row>
                {/if}
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">No teams yet.</p>
      {/if}
    </section>

    <!-- Routing Policies -->
    <section id="routing" class="pt-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-1">Escalation</p>
          <h2 class="font-display text-2xl font-normal text-slate-900">Routing Policies</h2>
        </div>
        <Button variant={addingPolicy ? 'outline' : 'default'} size="sm" onclick={() => { addingPolicy = !addingPolicy; editingPolicyId = null; }}>
          {#if addingPolicy}<X class="size-4" /> Cancel{:else}<Plus class="size-4" /> Add{/if}
        </Button>
      </div>

      {#if addingPolicy}
        <form method="POST" action="?/createRoutingPolicy" class="mb-4 rounded-lg border border-warm-300/80 bg-warm-100/40 p-4">
          <div class="grid gap-4">
            <div class="grid gap-3 md:grid-cols-3">
              <div class="grid gap-2">
                <Label>Policy name</Label>
                <Input name="name" bind:value={newPolicyName} required />
              </div>
              <div class="grid gap-2">
                <Label>Facility</Label>
                <Select.Root type="single" name="facilityId" bind:value={newPolicyFacilityId}>
                  <Select.Trigger class="w-full justify-between">{data.facilities.find((f) => f.id === newPolicyFacilityId)?.name ?? 'All facilities'}</Select.Trigger>
                  <Select.Content>
                    <Select.Item value="" label="All facilities" />
                    {#each data.facilities as facility}
                      <Select.Item value={facility.id} label={facility.name} />
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
              <div class="grid gap-2">
                <Label>Active</Label>
                <div class="flex h-9 items-center">
                  <Switch.Root
                    checked={newPolicyActive}
                    onCheckedChange={(checked) => (newPolicyActive = checked)}
                    class="relative w-11 h-6 rounded-full bg-warm-200 data-[state=checked]:bg-amber transition-colors cursor-pointer"
                  >
                    <Switch.Thumb class="block size-5 rounded-full bg-white shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[1.375rem]" />
                  </Switch.Root>
                </div>
              </div>
            </div>
            <input type="hidden" name="isActive" value={newPolicyActive ? 'true' : 'false'} />

            <p class="text-xs font-semibold uppercase tracking-wider text-amber">Conditions</p>
            <div class="grid gap-3 md:grid-cols-3">
              <div class="grid gap-2">
                <Label>Severity</Label>
                <div class="flex gap-3">
                  {#each ['SEV1', 'SEV2', 'SEV3'] as sev}
                    <label class="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={newPolicyConditions.severities.includes(sev)} on:change={(e) => {
                        if (e.currentTarget.checked) {
                          newPolicyConditions.severities = [...newPolicyConditions.severities, sev];
                        } else {
                          newPolicyConditions.severities = newPolicyConditions.severities.filter((s) => s !== sev);
                        }
                      }} class="size-4 rounded border-warm-300 accent-amber" />
                      {sev}
                    </label>
                  {/each}
                </div>
              </div>
              <div class="grid gap-2">
                <Label>Area filter</Label>
                <Input bind:value={newPolicyConditions.areas} placeholder="any" />
              </div>
              <div class="grid gap-2">
                <Label>Time window</Label>
                <div class="flex gap-2 items-center">
                  <Input type="time" bind:value={newPolicyConditions.timeWindowFrom} class="w-28" />
                  <span class="text-muted-foreground text-sm">to</span>
                  <Input type="time" bind:value={newPolicyConditions.timeWindowTo} class="w-28" />
                </div>
              </div>
            </div>
            <input type="hidden" name="conditionsJson" value={buildConditionsJson(newPolicyConditions)} />

            <p class="text-xs font-semibold uppercase tracking-wider text-amber">Escalation Steps</p>
            <div class="grid gap-3">
              {#each newPolicySteps as step, i}
                <div class="rounded-lg border border-warm-300/80 bg-warm-white/80 p-3">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-slate-500">Step {i + 1}</span>
                    {#if newPolicySteps.length > 1}
                      <Button variant="ghost" size="icon-sm" onclick={() => (newPolicySteps = removeStep(newPolicySteps, i))}>
                        <Trash2 class="size-3.5" />
                      </Button>
                    {/if}
                  </div>
                  <div class="grid gap-2 sm:grid-cols-3">
                    <div class="grid gap-1">
                      <Label>Delay (minutes)</Label>
                      <Input type="number" bind:value={step.delayMinutes} min="0" />
                    </div>
                    <div class="grid gap-1">
                      <Label>Notify type</Label>
                      <Select.Root type="single" bind:value={step.notifyType}>
                        <Select.Trigger class="w-full justify-between">{step.notifyType}</Select.Trigger>
                        <Select.Content>
                          <Select.Item value="team" label="Team" />
                          <Select.Item value="member" label="Member" />
                        </Select.Content>
                      </Select.Root>
                    </div>
                    <div class="flex items-end">
                      <label class="flex items-center gap-2 text-sm h-9">
                        <input type="checkbox" bind:checked={step.ifUnacked} class="size-4 rounded border-warm-300 accent-amber" />
                        Only if unacknowledged
                      </label>
                    </div>
                  </div>
                </div>
              {/each}
              <Button variant="outline" size="sm" onclick={() => (newPolicySteps = addStep(newPolicySteps))}>
                <Plus class="size-4" /> Add step
              </Button>
            </div>
            <input type="hidden" name="stepsJson" value={buildStepsJson(newPolicySteps)} />

            <Button type="submit">Create policy</Button>
          </div>
        </form>
      {/if}

      {#if orderedPolicies.length > 1}
        <div class="mb-6">
          <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-2">Priority Order</p>
          <div class="grid gap-2">
            {#each orderedPolicies as policy, i}
              <div class="flex items-center gap-2 rounded-md border border-warm-300/80 bg-warm-white/80 px-3 py-2">
                <span class="text-sm font-semibold text-slate-500 w-6">{i + 1}</span>
                <span class="text-sm flex-1">{policy.name}</span>
                <Button variant="ghost" size="icon-sm" disabled={i === 0} onclick={() => movePolicy(i, -1)}>
                  <ChevronUp class="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" disabled={i === orderedPolicies.length - 1} onclick={() => movePolicy(i, 1)}>
                  <ChevronDown class="size-3.5" />
                </Button>
              </div>
            {/each}
          </div>
          <form method="POST" action="?/reorderRoutingPolicies" class="mt-2">
            <input type="hidden" name="orderedPolicyIds" value={orderedPolicies.map((p) => p.id).join(',')} />
            <Button type="submit" variant="outline" size="sm">Save order</Button>
          </form>
        </div>
      {/if}

      {#if data.routingPolicies.length > 0}
        <div class="grid gap-4">
          {#each data.routingPolicies as policy}
            <div class="rounded-lg border border-warm-300/80 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-slate-900">{policy.name}</p>
                  <p class="text-sm text-muted-foreground">
                    {policy.facilityId ? data.facilities.find((f) => f.id === policy.facilityId)?.name ?? 'Unknown' : 'All facilities'}
                    {policy.isActive ? '' : ' (inactive)'}
                  </p>
                </div>
                <div class="flex gap-1">
                  <Button variant="ghost" size="icon-sm" onclick={() => { if (editingPolicyId === policy.id) { editingPolicyId = null; } else { startEditPolicy(policy); } }}>
                    <Pencil class="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onclick={() => startDelete(policy.id, 'policy')}>
                    <Trash2 class="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>

              {#if editingPolicyId === policy.id}
                <form method="POST" action="?/updateRoutingPolicy" class="mt-4 grid gap-4">
                  <input type="hidden" name="policyId" value={policy.id} />
                  <div class="grid gap-3 md:grid-cols-3">
                    <div class="grid gap-2">
                      <Label>Name</Label>
                      <Input name="name" value={policy.name} required />
                    </div>
                    <div class="grid gap-2">
                      <Label>Facility</Label>
                      <Select.Root type="single" name="facilityId" value={policy.facilityId ?? ''}>
                        <Select.Trigger class="w-full justify-between">{data.facilities.find((f) => f.id === policy.facilityId)?.name ?? 'All facilities'}</Select.Trigger>
                        <Select.Content>
                          <Select.Item value="" label="All facilities" />
                          {#each data.facilities as facility}
                            <Select.Item value={facility.id} label={facility.name} />
                          {/each}
                        </Select.Content>
                      </Select.Root>
                    </div>
                    <div class="grid gap-2">
                      <Label>Active</Label>
                      <div class="flex h-9 items-center">
                        <Switch.Root
                          checked={editPolicyActive}
                          onCheckedChange={(checked) => (editPolicyActive = checked)}
                          class="relative w-11 h-6 rounded-full bg-warm-200 data-[state=checked]:bg-amber transition-colors cursor-pointer"
                        >
                          <Switch.Thumb class="block size-5 rounded-full bg-white shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[1.375rem]" />
                        </Switch.Root>
                      </div>
                    </div>
                  </div>
                  <input type="hidden" name="isActive" value={editPolicyActive ? 'true' : 'false'} />

                  <p class="text-xs font-semibold uppercase tracking-wider text-amber">Conditions</p>
                  <div class="grid gap-3 md:grid-cols-3">
                    <div class="grid gap-2">
                      <Label>Severity</Label>
                      <div class="flex gap-3">
                        {#each ['SEV1', 'SEV2', 'SEV3'] as sev}
                          <label class="flex items-center gap-1.5 text-sm">
                            <input type="checkbox" checked={editPolicyConditions.severities.includes(sev)} on:change={(e) => {
                              if (e.currentTarget.checked) {
                                editPolicyConditions.severities = [...editPolicyConditions.severities, sev];
                              } else {
                                editPolicyConditions.severities = editPolicyConditions.severities.filter((s) => s !== sev);
                              }
                            }} class="size-4 rounded border-warm-300 accent-amber" />
                            {sev}
                          </label>
                        {/each}
                      </div>
                    </div>
                    <div class="grid gap-2">
                      <Label>Area filter</Label>
                      <Input bind:value={editPolicyConditions.areas} placeholder="any" />
                    </div>
                    <div class="grid gap-2">
                      <Label>Time window</Label>
                      <div class="flex gap-2 items-center">
                        <Input type="time" bind:value={editPolicyConditions.timeWindowFrom} class="w-28" />
                        <span class="text-muted-foreground text-sm">to</span>
                        <Input type="time" bind:value={editPolicyConditions.timeWindowTo} class="w-28" />
                      </div>
                    </div>
                  </div>
                  <input type="hidden" name="conditionsJson" value={buildConditionsJson(editPolicyConditions)} />

                  <p class="text-xs font-semibold uppercase tracking-wider text-amber">Escalation Steps</p>
                  <div class="grid gap-3">
                    {#each editPolicySteps as step, i}
                      <div class="rounded-lg border border-warm-300/80 bg-warm-white/80 p-3">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-xs font-semibold text-slate-500">Step {i + 1}</span>
                          {#if editPolicySteps.length > 1}
                            <Button variant="ghost" size="icon-sm" onclick={() => (editPolicySteps = removeStep(editPolicySteps, i))}>
                              <Trash2 class="size-3.5" />
                            </Button>
                          {/if}
                        </div>
                        <div class="grid gap-2 sm:grid-cols-3">
                          <div class="grid gap-1">
                            <Label>Delay (minutes)</Label>
                            <Input type="number" bind:value={step.delayMinutes} min="0" />
                          </div>
                          <div class="grid gap-1">
                            <Label>Notify type</Label>
                            <Select.Root type="single" bind:value={step.notifyType}>
                              <Select.Trigger class="w-full justify-between">{step.notifyType}</Select.Trigger>
                              <Select.Content>
                                <Select.Item value="team" label="Team" />
                                <Select.Item value="member" label="Member" />
                              </Select.Content>
                            </Select.Root>
                          </div>
                          <div class="flex items-end">
                            <label class="flex items-center gap-2 text-sm h-9">
                              <input type="checkbox" bind:checked={step.ifUnacked} class="size-4 rounded border-warm-300 accent-amber" />
                              Only if unacknowledged
                            </label>
                          </div>
                        </div>
                      </div>
                    {/each}
                    <Button variant="outline" size="sm" onclick={() => (editPolicySteps = addStep(editPolicySteps))}>
                      <Plus class="size-4" /> Add step
                    </Button>
                  </div>
                  <input type="hidden" name="stepsJson" value={buildStepsJson(editPolicySteps)} />

                  <div class="flex gap-2">
                    <Button type="submit" variant="secondary">Save policy</Button>
                    <Button type="button" variant="outline" onclick={() => (editingPolicyId = null)}>Cancel</Button>
                  </div>
                </form>
              {/if}

              {#if deletingId === policy.id && deletingSection === 'policy'}
                <form method="POST" action="?/deleteRoutingPolicy" class="flex items-center gap-3 mt-3 pt-3 border-t border-warm-200">
                  <input type="hidden" name="policyId" value={policy.id} />
                  <p class="text-sm text-destructive">Delete this policy?</p>
                  <Button type="submit" variant="destructive" size="sm">Confirm</Button>
                  <Button type="button" variant="outline" size="sm" onclick={cancelDelete}>Cancel</Button>
                </form>
              {/if}
            </div>
          {/each}
        </div>
      {:else if !addingPolicy}
        <p class="text-sm text-muted-foreground">No routing policies yet.</p>
      {/if}
    </section>
  </div>
</div>
