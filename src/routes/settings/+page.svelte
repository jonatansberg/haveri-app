<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  export let data: PageData;
  export let form: ActionData | null = null;

  function memberIdsForTeam(teamId: string): string[] {
    return data.memberships
      .filter((membership) => membership.teamId === teamId)
      .map((membership) => membership.memberId);
  }

  function routingOrder(): string {
    return data.routingPolicies.map((policy) => policy.id).join(',');
  }
</script>

<section class="grid gap-6">
  {#if form?.error}
    <p class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{JSON.stringify(form.error)}</p>
  {/if}

  <Card.Root>
    <Card.Header>
      <Card.Title>Organization Settings</Card.Title>
    </Card.Header>
    <Card.Content>
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
          <Button type="submit">Save organization</Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Facilities</Card.Title>
    </Card.Header>
    <Card.Content class="grid gap-4">
      <form method="POST" action="?/createFacility" class="grid gap-3 md:grid-cols-3">
        <Input name="name" placeholder="New facility name" required />
        <Input name="timezone" placeholder="Europe/Stockholm" required />
        <Button type="submit">Add facility</Button>
      </form>

      {#each data.facilities as facility}
        <form method="POST" action="?/updateFacility" class="grid gap-2 rounded-md border p-3 md:grid-cols-4">
          <input type="hidden" name="id" value={facility.id} />
          <Input name="name" value={facility.name} required />
          <Input name="timezone" value={facility.timezone} required />
          <div class="flex gap-2">
            <Button type="submit" variant="secondary">Update</Button>
            <Button formaction="?/deleteFacility" type="submit" variant="outline">Delete</Button>
          </div>
        </form>
      {/each}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Areas</Card.Title>
    </Card.Header>
    <Card.Content class="grid gap-4">
      <form method="POST" action="?/createArea" class="grid gap-3 md:grid-cols-4">
        <select name="facilityId" class="rounded-md border px-3 py-2" required>
          {#each data.facilities as facility}
            <option value={facility.id}>{facility.name}</option>
          {/each}
        </select>
        <Input name="name" placeholder="Area name" required />
        <Input name="description" placeholder="Description (optional)" />
        <Button type="submit">Add area</Button>
      </form>

      {#each data.areas as area}
        <form method="POST" action="?/updateArea" class="grid gap-2 rounded-md border p-3 md:grid-cols-4">
          <input type="hidden" name="id" value={area.id} />
          <Input name="name" value={area.name} required />
          <Input name="description" value={area.description ?? ''} />
          <div class="flex gap-2 md:col-span-2">
            <Button type="submit" variant="secondary">Update</Button>
            <Button formaction="?/deleteArea" type="submit" variant="outline">Delete</Button>
          </div>
        </form>
      {/each}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Assets</Card.Title>
    </Card.Header>
    <Card.Content class="grid gap-4">
      <form method="POST" action="?/createAsset" class="grid gap-3 md:grid-cols-5">
        <select name="areaId" class="rounded-md border px-3 py-2" required>
          {#each data.areas as area}
            <option value={area.id}>{area.name}</option>
          {/each}
        </select>
        <Input name="name" placeholder="Asset name" required />
        <Input name="assetType" placeholder="asset_type" required />
        <Input name="metadataJson" placeholder="JSON metadata object" />
        <Button type="submit">Add asset</Button>
      </form>

      {#each data.assets as asset}
        <form method="POST" action="?/updateAsset" class="grid gap-2 rounded-md border p-3 md:grid-cols-5">
          <input type="hidden" name="id" value={asset.id} />
          <select name="areaId" class="rounded-md border px-3 py-2" required>
            {#each data.areas as area}
              <option value={area.id} selected={area.id === asset.areaId}>{area.name}</option>
            {/each}
          </select>
          <Input name="name" value={asset.name} required />
          <Input name="assetType" value={asset.assetType} required />
          <Input name="metadataJson" value={JSON.stringify(asset.metadata ?? {})} />
          <div class="flex gap-2">
            <Button type="submit" variant="secondary">Update</Button>
            <Button formaction="?/deleteAsset" type="submit" variant="outline">Delete</Button>
          </div>
        </form>
      {/each}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Teams</Card.Title>
    </Card.Header>
    <Card.Content class="grid gap-4">
      <form method="POST" action="?/createTeam" class="grid gap-3 md:grid-cols-4">
        <Input name="name" placeholder="Team name" required />
        <select name="facilityId" class="rounded-md border px-3 py-2">
          <option value="">No facility</option>
          {#each data.facilities as facility}
            <option value={facility.id}>{facility.name}</option>
          {/each}
        </select>
        <Input name="shiftInfoJson" placeholder="Shift schedule JSON" />
        <Button type="submit">Add team</Button>
      </form>

      {#each data.teams as team}
        <div class="grid gap-2 rounded-md border p-3">
          <form method="POST" action="?/updateTeam" class="grid gap-2 md:grid-cols-4">
            <input type="hidden" name="id" value={team.id} />
            <Input name="name" value={team.name} required />
            <select name="facilityId" class="rounded-md border px-3 py-2">
              <option value="">No facility</option>
              {#each data.facilities as facility}
                <option value={facility.id} selected={facility.id === team.facilityId}>{facility.name}</option>
              {/each}
            </select>
            <Input name="shiftInfoJson" value={JSON.stringify(team.shiftInfo ?? {})} />
            <div class="flex gap-2">
              <Button type="submit" variant="secondary">Update</Button>
              <Button formaction="?/deleteTeam" type="submit" variant="outline">Delete</Button>
            </div>
          </form>

          <form method="POST" action="?/setTeamMembers" class="grid gap-2">
            <input type="hidden" name="teamId" value={team.id} />
            <Label>Members</Label>
            <select
              name="memberIds"
              multiple
              class="min-h-28 rounded-md border px-3 py-2"
            >
              {#each data.members as member}
                <option value={member.id} selected={memberIdsForTeam(team.id).includes(member.id)}>
                  {member.name} ({member.role})
                </option>
              {/each}
            </select>
            <Button type="submit" variant="outline">Save team members</Button>
          </form>
        </div>
      {/each}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Routing Policies</Card.Title>
    </Card.Header>
    <Card.Content class="grid gap-4">
      <form method="POST" action="?/createRoutingPolicy" class="grid gap-2 rounded-md border p-3">
        <Input name="name" placeholder="Policy name" required />
        <select name="facilityId" class="rounded-md border px-3 py-2">
          <option value="">All facilities</option>
          {#each data.facilities as facility}
            <option value={facility.id}>{facility.name}</option>
          {/each}
        </select>
        <Input name="isActive" value="true" />
        <Label>Conditions JSON</Label>
        <textarea
          name="conditionsJson"
          rows="4"
          class="rounded-md border px-3 py-2 text-sm"
        >{"{\"severity\":[\"SEV1\"],\"area\":[\"any\"],\"timeWindow\":[\"06:00-18:00\"]}"}</textarea>
        <Label>Steps JSON</Label>
        <textarea name="stepsJson" rows="6" class="rounded-md border px-3 py-2 text-sm"
          >{"[{\"delayMinutes\":0,\"notifyType\":\"team\",\"notifyTargetIds\":[],\"ifUnacked\":true}]"}</textarea
        >
        <Button type="submit">Create policy</Button>
      </form>

      <form method="POST" action="?/reorderRoutingPolicies" class="grid gap-2 rounded-md border p-3">
        <Label for="routing-order">Policy order (comma-separated policy ids)</Label>
        <Input id="routing-order" name="orderedPolicyIds" value={routingOrder()} required />
        <Button type="submit" variant="outline">Save policy order</Button>
      </form>

      {#each data.routingPolicies as policy}
        <form method="POST" action="?/updateRoutingPolicy" class="grid gap-2 rounded-md border p-3">
          <input type="hidden" name="policyId" value={policy.id} />
          <Input name="name" value={policy.name} required />
          <select name="facilityId" class="rounded-md border px-3 py-2">
            <option value="">All facilities</option>
            {#each data.facilities as facility}
              <option value={facility.id} selected={facility.id === policy.facilityId}>{facility.name}</option>
            {/each}
          </select>
          <Input name="isActive" value={policy.isActive ? 'true' : 'false'} />
          <textarea name="conditionsJson" rows="4" class="rounded-md border px-3 py-2 text-sm"
            >{JSON.stringify(policy.conditions, null, 2)}</textarea
          >
          <textarea name="stepsJson" rows="6" class="rounded-md border px-3 py-2 text-sm"
            >{JSON.stringify(
              policy.steps.map((step) => ({
                delayMinutes: step.delayMinutes,
                notifyType: step.notifyType,
                notifyTargetIds: step.notifyTargetIds,
                ifUnacked: step.ifUnacked
              })),
              null,
              2
            )}</textarea
          >
          <div class="flex gap-2">
            <Button type="submit" variant="secondary">Update</Button>
            <Button formaction="?/deleteRoutingPolicy" type="submit" variant="outline">Delete</Button>
          </div>
        </form>
      {/each}
    </Card.Content>
  </Card.Root>
</section>
