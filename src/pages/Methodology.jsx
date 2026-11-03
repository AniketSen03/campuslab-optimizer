import PageHeader from '../components/PageHeader.jsx';

function Section({ title, children }) {
  return (
    <section className="card p-5">
      <h2 className="mb-2 text-base">{title}</h2>
      <div className="max-w-3xl space-y-2 text-[13.5px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}
const L = ({ items }) => <ul className="list-disc space-y-1 pl-5">{items.map((t) => <li key={t}>{t}</li>)}</ul>;

export default function Methodology() {
  return (
    <>
      <PageHeader title="About and methodology" description="How allocation decisions are made, what is guaranteed, and what is not." />
      <div className="space-y-4">
        <Section title="Objective">
          <p>Schedule as many requests as possible first. Among schedules with the same count, minimise total unused seats, where unused seats for a session = lab capacity − computers required, summed over scheduled sessions only. Ties are broken deterministically.</p>
        </Section>
        <Section title="Hard constraints">
          <L items={[
            'A request is one indivisible session: placed exactly once in one lab and slot, or left unallocated.',
            'A lab hosts at most one request per slot (no double-booking).',
            'Lab capacity must be at least the computers required.',
            'Only slots the request allows and the lab has available may be used.',
          ]} />
          <p>An independent validator re-checks every schedule against these rules. The conflict count shown in the app comes from that validator, not from the algorithms.</p>
        </Section>
        <Section title="FCFS (baseline)">
          <p>Requests are handled in input order. For each, slots are tried in slot order and labs in input order; the first free lab with enough capacity is taken. Earlier decisions are never revisited, so a flexible early request can occupy the only cell a later, less flexible request needs.</p>
        </Section>
        <Section title="Improved: constraint-based greedy + best fit">
          <L items={[
            'Order: requests with the fewest feasible lab-slot cells go first, then fewer allowed slots, then larger demand, then input order.',
            'Best fit: each request takes the free cell with the fewest idle seats. Ties go to the cell wanted by fewer requests, then earlier slot, then earlier lab.',
            'Repair: for any request left unplaced, the algorithm searches for a chain of moves of already-placed requests that frees a cell for it (an augmenting path). This can only increase the scheduled count.',
          ]} />
          <p>It is a heuristic. It aims to maximise scheduled requests and then reduce idle seats, but it does not guarantee the minimum unused seats and makes no claim of global optimality.</p>
        </Section>
        <Section title="Why the improved method can perform better">
          <p>Handling constrained requests first and fitting them into the smallest suitable lab leaves large labs free for large requests. The repair step recovers requests that a pure greedy order would block. Example failure of FCFS: one lab with S1 and S2, request R1 allows S1 or S2 and arrives first, R2 allows only S1. FCFS gives R1 the S1 cell and R2 is lost; the improved method moves R1 to S2 and schedules both.</p>
        </Section>
        <Section title="Trade-offs and failure cases">
          <L items={[
            'Because count has priority, the repair step may move a request into a larger lab and increase idle seats in order to schedule one more request.',
            'Greedy best fit can pick a cell that is locally tight but leaves a poor combination for the remaining seat total; the final seat total can be worse than the true optimum.',
            'FCFS is predictable and simple, but its result depends entirely on input order.',
            'Deterministic tie-breaking means equal-capacity labs are filled in input order; results are repeatable but not "balanced".',
          ]} />
        </Section>
        <Section title="Expected time complexity">
          <p>Let n = requests, L = labs, S = slots, and E = total feasible (request, lab, slot) options, with E ≤ n·L·S.</p>
          <L items={[
            'FCFS: O(n·L·S) to enumerate options, with constant-time lab-slot lookups.',
            'Improved: sorting options O(E log E); greedy O(E); repair O(n·E) in the worst case, since each augmenting search visits each cell at most once.',
          ]} />
          <p>On larger inputs the improved method grows faster than FCFS in theory but stays small in practice because most requests have few feasible cells. Measured runtime on the Comparison page is wall-clock time in your browser for the current data; it fluctuates and says nothing about asymptotic behaviour.</p>
        </Section>
      </div>
    </>
  );
}
