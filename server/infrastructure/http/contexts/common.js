export const makeUseCase = (fn) => ({ execute: fn });

export const adaptUseCase = (
  useCase,
  mapInput = (input) => input,
  mapOutput = (output) => output
) => ({
  async execute(input) {
    const mappedInput = await mapInput(input);
    const result = await useCase.execute(mappedInput);
    return mapOutput(result, input);
  },
});

export const noopNotification = { sendNotification: async () => {} };

export const normalizeIdentifier = (input = '') =>
  String(input || '').trim().toLowerCase();
