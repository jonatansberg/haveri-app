<script lang="ts">
  import type { PageData } from './$types';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
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
      <Card.Title class="text-3xl text-slate-900">Follow-ups</Card.Title>
      <Card.Description class="text-slate-600">
        Track action items across incidents with overdue-first ordering.
      </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-4">
      <form method="GET" class="grid gap-3 rounded-lg border border-warm-300/80 bg-warm-100/40 p-3 lg:grid-cols-4">
        <div class="grid gap-1">
          <Label for="status">Status</Label>
          <select id="status" name="status" bind:value={status} class="border-input bg-background rounded-md border px-2 py-2 text-sm">
            <option value="">All</option>
            {#each statuses as statusOption}
              <option value={statusOption}>{statusOption}</option>
            {/each}
          </select>
        </div>
        <div class="grid gap-1">
          <Label for="assignedToMemberId">Assignee</Label>
          <select
            id="assignedToMemberId"
            name="assignedToMemberId"
            bind:value={assignedToMemberId}
            class="border-input bg-background rounded-md border px-2 py-2 text-sm"
          >
            <option value="">All</option>
            {#each data.members as member}
              <option value={member.id}>{member.name}</option>
            {/each}
          </select>
        </div>
        <div class="grid gap-1">
          <Label for="facilityId">Facility</Label>
          <select id="facilityId" name="facilityId" bind:value={facilityId} class="border-input bg-background rounded-md border px-2 py-2 text-sm">
            <option value="">All</option>
            {#each data.facilities as facility}
              <option value={facility.id}>{facility.name}</option>
            {/each}
          </select>
        </div>
        <div class="grid gap-1">
          <Label for="overdue">Overdue only</Label>
          <input
            id="overdue"
            name="overdue"
            type="checkbox"
            class="h-4 w-4 rounded border border-input"
            bind:checked={overdue}
            value="true"
          />
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
                    <a href={`/incidents/${followUp.incidentId}`} class="underline underline-offset-4">
                      {followUp.incidentId}
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
