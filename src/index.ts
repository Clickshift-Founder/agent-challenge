import { logger, type IAgentRuntime, type Project, type ProjectAgent } from '@elizaos/core';
import { defiIntelligencePlugin } from './plugins/defi-intelligence/index.ts';
import { character } from './character.ts';

// @ts-ignore
import openaiPlugin from '@elizaos/plugin-openai';

const initCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing ClickShift Alpha agent');
  logger.info({ name: character.name }, 'Agent name:');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  plugins: [openaiPlugin, defiIntelligencePlugin],
};

const project: Project = {
  agents: [projectAgent],
};

export { character } from './character.ts';
export default project;