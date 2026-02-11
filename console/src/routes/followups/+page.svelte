<script lang="ts">
  import type { PageData } from './$types';
  import { Switch } from 'bits-ui';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import * as Table from '$lib/components/ui/table';

  export let data: PageData;

  const statuses = ['OPEN', 'IN_PROGRESS', 'DONE'] as const;
  let status = data.filters.status;
  let assignedToMemberId = data.filters.assignedToMemberId;
  let facilityId = data.filters.facilityId;
  let overdue = data.filters.overdue;

  function assigneeName(memberId: string | null): string {
    if (!memberId) {
      return 'Unassigned';
    }

    return data.members.find((member) => member.id === memberId)?.name ?? memberId;
  }

  function badgeVariant(followUpStatus: string): 'secondary' | 'outline' {
    return followUpStatus === 'DONE' ? 'outline' : 'secondary';
  }
</script>

<section class="grid gap-6">
  <Card.Root class="border-warm-300/80 bg-card/95 shadow-sm">
    <Card.Header>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-amber mb-1">Action Items</p>
        <Card.Title class="font-display text-2xl font-normal text-slate-900">Follow-ups</Card.Title>
      </div>
      <Card.Description class="text-slate-600">
        Track action items across incidents with overdue-first ordering.
      </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-4">
      <form method="GET" class="grid gap-3 rounded-lg border border-warm-300/80 bg-warm-100/40 p-3 lg:grid-cols-4">
        <div class="grid gap-1">
          <Label for="status">Status</Label>
          <Select.Root type="single" name="status" bind:value={status}>
            <Select.Trigger id="status" class="w-full justify-between">
              {status || 'All'}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="" label="All" />
              {#each statuses as statusOption}
                <Select.Item value={statusOption} label={statusOption} />
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        <div class="grid gap-1">
          <Label for="assignedToMemberId">Assignee</Label>
          <Select.Root type="single" name="assignedToMemberId" bind:value={assignedToMemberId}>
            <Select.Trigger id="assignedToMemberId" class="w-full justify-between">
              {data.members.find((m) => m.id === assignedToMemberId)?.name ?? 'All'}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="" label="All" />
              {#each data.members as member}
                <Select.Item value={member.id} label={member.name} />
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        <div class="grid gap-1">
          <Label for="facilityId">Facility</Label>
          <Select.Root type="single" name="facilityId" bind:value={facilityId}>
            <Select.Trigger id="facilityId" class="w-full justify-between">
              {data.facilities.find((f) => f.id === facilityId)?.name ?? 'All'}
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
          <Label for="overdue">Overdue only</Label>
          <div class="flex h-9 items-center">
            <Switch.Root
              id="overdue"
              checked={overdue}
              onCheckedChange={(checked) => (overdue = checked)}
              class="relative w-11 h-6 rounded-full bg-warm-200 data-[state=checked]:bg-amber transition-colors cursor-pointer"
            >
              <Switch.Thumb class="block size-5 rounded-full bg-white shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[1.375rem]" />
            </Switch.Root>
            {#if overdue}
              <input type="hidden" name="overdue" value="true" />
            {/if}
          </div>
        </div>
        <div class="lg:col-span-4 flex flex-wrap gap-2">
          <Button type="submit" variant="secondary">Apply filters</Button>
          <Button href="/followups" variant="outline">Clear</Button>
        </div>
      </form>

      <div class="overflow-x-auto rounded-lg border border-warm-300/80">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Description</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Assignee</Table.Head>
              <Table.Head>Due date</Table.Head>
              <Table.Head>Incident</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if data.followUps.length === 0}
              <Table.Row>
                <Table.Cell colspan={5} class="text-muted-foreground">No follow-ups match these filters.</Table.Cell>
              </Table.Row>
            {:else}
              {#each data.followUps as followUp}
                <Table.Row>
                  <Table.Cell>{followUp.description}</Table.Cell>
                  <Table.Cell><Badge variant={badgeVariant(followUp.status)}>{followUp.status}</Badge></Table.Cell>
                  <Table.Cell>{assigneeName(followUp.assignedToMemberId)}</Table.Cell>
                  <Table.Cell>{followUp.dueDate ?? '-'}</Table.Cell>
                  <Table.Cell>
                    <a href={`/incidents/${followUp.incidentId}`} class="font-medium text-slate-900 underline-offset-4 hover:underline">
                      {followUp.incidentTitle ?? followUp.incidentId.slice(0, 8)}
                    </a>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </Card.Content>
  </Card.Root>
</section>
