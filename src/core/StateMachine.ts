export type TransitionMap<TState extends string> = Readonly<
  Partial<Record<TState, readonly TState[]>>
>;

export type StateChangeListener<TState extends string> = (
  current: TState,
  previous: TState,
) => void;

export class StateMachine<TState extends string> {
  readonly #transitions: TransitionMap<TState>;
  readonly #listeners = new Set<StateChangeListener<TState>>();
  #state: TState;

  constructor(initialState: TState, transitions: TransitionMap<TState>) {
    this.#state = initialState;
    this.#transitions = transitions;
  }

  get state(): TState {
    return this.#state;
  }

  canTransition(nextState: TState): boolean {
    return this.#transitions[this.#state]?.includes(nextState) ?? false;
  }

  transition(nextState: TState): void {
    if (!this.canTransition(nextState)) {
      throw new Error(`Illegal state transition: ${this.#state} -> ${nextState}`);
    }

    const previousState = this.#state;
    this.#state = nextState;
    for (const listener of this.#listeners) {
      listener(nextState, previousState);
    }
  }

  subscribe(listener: StateChangeListener<TState>): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}
