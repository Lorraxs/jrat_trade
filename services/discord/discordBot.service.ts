import { inject, injectable, named } from "inversify";
import {
  defineService,
  ServicesContainer,
} from "../../utils/servicesContainer";
import {
  registerAppContribution,
  AppContribution,
} from "../app/app.extensions";
import { ScopedLogger } from "../log/scopedLogger";
import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
import {
  DiscordLogChannels,
  type IDiscordLogChannel,
} from "../crypto/types/type";

export type IDiscordBotService = DiscordBotService;
export const IDiscordBotService =
  defineService<IDiscordBotService>("DiscordBotService");

export function registerDiscordBotService(container: ServicesContainer) {
  container.registerImpl(IDiscordBotService, DiscordBotService);
  registerAppContribution(container, DiscordBotService);
}

@injectable()
export class DiscordBotService implements AppContribution {
  @inject(ScopedLogger)
  @named("DiscordBotService")
  private logService: ScopedLogger;

  private client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  channels: {
    [key in IDiscordLogChannel]: TextChannel | null;
  } = {
    DISCORD_LOG_CHANNEL_ID: null,
    DISCORD_BUOB_CHANNEL_ID: null,
    DISCORD_BUY_SIGNAL_CHANNEL_ID: null,
    DISCORD_WS_CLOSE_CHANNEL_ID: null,
    DISCORD_WS_DEBUG_CHANNEL_ID: null,

    DISCORD_CONDITION_15M_1_CHANNEL_ID: null,
    DISCORD_CONDITION_15M_2_CHANNEL_ID: null,
    DISCORD_CONDITION_15M_3_CHANNEL_ID: null,
    DISCORD_CONDITION_15M_4_CHANNEL_ID: null,
    DISCORD_CONDITION_15M_5_CHANNEL_ID: null,

    DISCORD_CONDITION_30M_1_CHANNEL_ID: null,
    DISCORD_CONDITION_30M_2_CHANNEL_ID: null,
    DISCORD_CONDITION_30M_3_CHANNEL_ID: null,
    DISCORD_CONDITION_30M_4_CHANNEL_ID: null,
    DISCORD_CONDITION_30M_5_CHANNEL_ID: null,

    DISCORD_CONDITION_1H_1_CHANNEL_ID: null,
    DISCORD_CONDITION_1H_2_CHANNEL_ID: null,
    DISCORD_CONDITION_1H_3_CHANNEL_ID: null,
    DISCORD_CONDITION_1H_4_CHANNEL_ID: null,
    DISCORD_CONDITION_1H_5_CHANNEL_ID: null,
    LUX_ALGO_ORDER_BLOCKS: null,
  };

  loading = false;

  async init() {
    this.logService.print.warning("Initializing");
    this.client.once(Events.ClientReady, async (client) => {
      this.logService.print.success(
        `Discord bot ready! Logged in as ${client.user.tag}`
      );
      for (const channel of DiscordLogChannels) {
        /* this.logService.print.warning(`Checking channel: ${channel}`); */
        if (process.env[channel]) {
          /* this.logService.print.success(`Valid env channel id: ${channel}`); */
          const rChannel = await this.client.channels.fetch(
            process.env[channel]
          );
          if (rChannel) {
            if (
              rChannel.isTextBased() &&
              rChannel.type === ChannelType.GuildText
            ) {
              /* this.logService.print.success(
                `found channel ${rChannel.name} [${rChannel.id}]`
              ); */
              this.channels[channel] = rChannel;
              //rChannel.send("```BOT RESTART```");
            }
          } else {
            this.logService.print.error(`Channel not found: ${channel}`);
          }
        }
      }
    });
  }

  async start() {
    this.client.login(process.env.DISCORD_BOT_TOKEN);
    this.logService.print.success("Started");
  }
}
