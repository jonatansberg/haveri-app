<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<section class="incident-detail">
  <a href="/">Back to dashboard</a>
  <h1>{data.incident.title}</h1>
  <p>
    <strong>Status:</strong> {data.incident.status} |
    <strong>Severity:</strong> {data.incident.severity} |
    <strong>Facility:</strong> {data.incident.facilityName}
  </p>

  <div class="grid">
    <div class="panel">
      <h2>Controls</h2>

      <form method="POST" action="?/status">
        <label>
          Status
          <select name="status">
            <option value="DECLARED">DECLARED</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="MITIGATED">MITIGATED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </label>
        <button type="submit">Update Status</button>
      </form>

      <form method="POST" action="?/severity">
        <label>
          Severity
          <select name="severity">
            <option value="SEV1">SEV1</option>
            <option value="SEV2">SEV2</option>
            <option value="SEV3">SEV3</option>
          </select>
        </label>
        <button type="submit">Update Severity</button>
      </form>

      <form method="POST" action="?/assign">
        <label>
          Assign Lead
          <select name="memberId">
            {#each data.members as member}
              <option value={member.id}>{member.name} ({member.role})</option>
            {/each}
          </select>
        </label>
        <button type="submit">Assign</button>
      </form>

      <form method="POST" action="?/ack">
        <button type="submit">Acknowledge Escalation</button>
      </form>
    </div>

    <div class="panel">
      <h2>Resolve Incident</h2>
      <form method="POST" action="?/resolve">
        <label>
          What happened
          <textarea name="whatHappened" required></textarea>
        </label>
        <label>
          Root cause
          <textarea name="rootCause" required></textarea>
        </label>
        <label>
          Resolution
          <textarea name="resolution" required></textarea>
        </label>
        <button type="submit">Mark Resolved</button>
      </form>

      <h2>Close Incident</h2>
      <form method="POST" action="?/close">
        <label>
          Follow-up tasks (one per line)
          <textarea name="followUps"></textarea>
        </label>
        <button type="submit">Close Incident</button>
      </form>
    </div>
  </div>

  <div class="grid">
    <div class="panel">
      <h2>Summary</h2>
      {#if data.summary}
        <p><strong>What happened:</strong> {data.summary.whatHappened}</p>
        <p><strong>Root cause:</strong> {data.summary.rootCause}</p>
        <p><strong>Resolution:</strong> {data.summary.resolution}</p>
      {:else}
        <p>No summary yet.</p>
      {/if}
    </div>

    <div class="panel">
      <h2>Follow-ups</h2>
      {#if data.followUps.length === 0}
        <p>No follow-ups.</p>
      {:else}
        <ul>
          {#each data.followUps as followUp}
            <li>
              <strong>{followUp.description}</strong>
              <form method="POST" action="?/followupStatus" class="inline-form">
                <input type="hidden" name="id" value={followUp.id} />
                <select name="status">
                  <option value="OPEN" selected={followUp.status === 'OPEN'}>OPEN</option>
                  <option value="IN_PROGRESS" selected={followUp.status === 'IN_PROGRESS'}>
                    IN_PROGRESS
                  </option>
                  <option value="DONE" selected={followUp.status === 'DONE'}>DONE</option>
                </select>
                <button type="submit">Save</button>
              </form>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  <div class="panel">
    <h2>Timeline</h2>
    <ol class="timeline">
      {#each data.events as event}
        <li>
          <p>
            <strong>#{event.sequence} {event.eventType}</strong>
            <span>{new Date(event.createdAt).toLocaleString()}</span>
          </p>
          <pre>{JSON.stringify(event.payload, null, 2)}</pre>
        </li>
      {/each}
    </ol>
  </div>
</section>

<style>
  .incident-detail {
    display: grid;
    gap: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }

  .panel {
    border: 1px solid #d6d1c0;
    border-radius: 12px;
    background: #fff;
    padding: 1rem;
  }

  form {
    display: grid;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
    font-weight: 600;
  }

  input,
  select,
  textarea {
    border: 1px solid #b5b8bb;
    border-radius: 6px;
    padding: 0.5rem 0.6rem;
    font: inherit;
  }

  textarea {
    min-height: 80px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.6rem;
  }

  .inline-form {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    margin-top: 0.4rem;
  }

  .timeline {
    display: grid;
    gap: 0.8rem;
    margin: 0;
    padding-left: 1.2rem;
  }

  pre {
    margin: 0.3rem 0 0;
    background: #f8f6f1;
    border: 1px solid #ece6d7;
    border-radius: 8px;
    padding: 0.6rem;
    overflow-x: auto;
    font-size: 0.85rem;
  }
</style>
