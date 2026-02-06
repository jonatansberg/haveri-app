<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<section class="dashboard">
  <div class="panel">
    <h1>Open Incidents</h1>
    <p class="subtitle">Declare and track production incidents from the web dashboard.</p>

    <form method="POST" action="?/declare" class="incident-form">
      <label>
        Title
        <input name="title" placeholder="Packaging line jammed at station 4" required />
      </label>

      <label>
        Severity
        <select name="severity">
          <option value="SEV1">SEV1</option>
          <option value="SEV2">SEV2</option>
          <option value="SEV3">SEV3</option>
        </select>
      </label>

      <label>
        Facility
        <select name="facilityId" required>
          {#each data.facilities as facility}
            <option value={facility.id}>{facility.name}</option>
          {/each}
        </select>
      </label>

      <label>
        Initial Lead (optional)
        <select name="assignedToMemberId">
          <option value="">Unassigned</option>
          {#each data.members as member}
            <option value={member.id}>{member.name} ({member.role})</option>
          {/each}
        </select>
      </label>

      <button type="submit">Declare Incident</button>
    </form>
  </div>

  <div class="panel">
    <h2>Recent Incidents</h2>

    {#if data.incidents.length === 0}
      <p>No incidents yet.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Severity</th>
            <th>Facility</th>
            <th>Declared</th>
          </tr>
        </thead>
        <tbody>
          {#each data.incidents as incident}
            <tr>
              <td><a href={`/incidents/${incident.id}`}>{incident.title}</a></td>
              <td>{incident.status}</td>
              <td>{incident.severity}</td>
              <td>{incident.facilityName}</td>
              <td>{new Date(incident.declaredAt).toLocaleString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</section>

<style>
  .dashboard {
    display: grid;
    gap: 1.2rem;
  }

  .panel {
    border: 1px solid #d6d1c0;
    border-radius: 12px;
    background: #fff;
    padding: 1rem;
  }

  .subtitle {
    color: #4d5a64;
    margin-top: 0;
  }

  .incident-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.8rem;
    align-items: end;
  }

  label {
    display: grid;
    gap: 0.35rem;
    font-weight: 600;
  }

  input,
  select {
    border: 1px solid #b5b8bb;
    border-radius: 6px;
    padding: 0.5rem 0.6rem;
    font: inherit;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    text-align: left;
    border-bottom: 1px solid #eee8d6;
    padding: 0.5rem;
  }

  th {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #4d5a64;
  }
</style>
