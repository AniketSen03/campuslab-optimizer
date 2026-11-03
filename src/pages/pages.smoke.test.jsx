import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from '../App.jsx';
import Dashboard from './Dashboard.jsx';
import Labs from './Labs.jsx';
import Requests from './Requests.jsx';
import Allocations from './Allocations.jsx';
import Comparison from './Comparison.jsx';
import Rescheduling from './Rescheduling.jsx';
import Methodology from './Methodology.jsx';
import { fcfs } from '../algorithms/fcfs.js';
import { improved } from '../algorithms/improved.js';
import { runAlgorithm } from '../algorithms/metrics.js';
import { INITIAL_LABS, INITIAL_REQUESTS } from '../data/initialData.js';

const make = (labs, requests) => ({
  labs, requests, setLabs() {}, setRequests() {}, snapshot: null, setSnapshot() {}, notify() {}, navigate() {},
  results: { fcfs: runAlgorithm('FCFS', fcfs, labs, requests), improved: runAlgorithm('Improved', improved, labs, requests) },
});

describe('pages render without throwing', () => {
  it('App shell', () => expect(renderToString(<App />)).toContain('CampusLab'));
  for (const [title, labs, reqs] of [['official', INITIAL_LABS, INITIAL_REQUESTS], ['empty', [], []], ['no labs', [], INITIAL_REQUESTS]]) {
    it(`all pages: ${title}`, () => {
      const p = make(labs, reqs);
      [Dashboard, Labs, Requests, Allocations, Comparison, Rescheduling].forEach((Page) => expect(renderToString(<Page {...p} />).length).toBeGreaterThan(50));
      expect(renderToString(<Methodology />)).toContain('Objective');
    });
  }
  it('Rescheduling with snapshot', () => {
    const after = INITIAL_LABS.map((l) => (l.id === 'A' ? { ...l, slots: ['S1', 'S3'] } : l));
    const p = { ...make(after, INITIAL_REQUESTS), snapshot: { labsBefore: INITIAL_LABS, labsAfter: after, requests: INITIAL_REQUESTS } };
    expect(renderToString(<Rescheduling {...p} />)).toContain('Original assignments changed');
  });
});
