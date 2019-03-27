// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required Bot Framework classes.
const { ActivityHandler, CardFactory } = require('botbuilder');

// Adaptive Card content
const IntroCard = require('./resources/IntroCard.json');

// Welcomed User property name
const WELCOMED_USER = 'welcomedUserProperty';

class WelcomeBot extends ActivityHandler {
    /**
     *
     * @param {UserState} User state to persist boolean flag to indicate
     *                    if the bot had already welcomed the user
     */
    constructor(userState) {
        super();
        // Creates a new user property accessor.
        // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.
        this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);

        this.userState = userState;

        this.onMessage(async context => {
            // Read UserState. If the 'DidBotWelcomedUser' does not exist (first time ever for a user)
            // set the default to false.
            const didBotWelcomedUser = await this.welcomedUserProperty.get(context, false);

            // Your bot should proactively send a welcome message to a personal chat the first time
            // (and only the first time) a user initiates a personal chat with your bot.
            if (didBotWelcomedUser === false) {
                // The channel should send the user name in the 'From' object
                let userName = context.activity.from.name;
                await context.sendActivity('You are seeing this message because this was your first message ever sent to this bot.');
                await context.sendActivity(`It is a good practice to welcome the user and provide personal greeting. For example, welcome ${ userName }.`);

                // Set the flag indicating the bot handled the user's first message.
                await this.welcomedUserProperty.set(context, true);
            } else {
                // This example uses an exact match on user's input utterance.
                // Consider using LUIS or QnA for Natural Language Processing.
                let text = context.activity.text.toLowerCase();
                switch (text) {
                case 'hello':
                case 'hi':
                    await context.sendActivity(`You said "${ context.activity.text }"`);
                    break;
                case 'intro':
                case 'help':
                    await context.sendActivity({
                        text: 'Intro Adaptive Card',
                        attachments: [CardFactory.adaptiveCard(IntroCard)]
                    });
                    break;
                default:
                    await context.sendActivity(`This is a simple Welcome Bot sample. You can say 'intro' to
                                                    see the introduction card. If you are running this bot in the Bot
                                                    Framework Emulator, press the 'Start Over' button to simulate user joining a bot or a channel`);
                }
            }
            // Save state changes
            await this.userState.saveChanges(context);
        });

        // Sends welcome messages to conversation members when they join the conversation.
        // Messages are only sent to conversation members who aren't the bot.
        this.onMembersAdded(async context => {
            // Do we have any new members added to the conversation?
            if (context.activity.membersAdded.length !== 0) {
                // Iterate over all new members added to the conversation
                for (let idx in context.activity.membersAdded) {
                    // Greet anyone that was not the target (recipient) of this message.
                    // Since the bot is the recipient for events from the channel,
                    // context.activity.membersAdded === context.activity.recipient.Id indicates the
                    // bot was added to the conversation, and the opposite indicates this is a user.
                    if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                        await context.sendActivity(`Welcome to the 'Welcome User' Bot. This bot will introduce you to welcoming and greeting users.`);
                        await context.sendActivity("You are seeing this message because the bot received at least one 'ConversationUpdate' " +
                            'event, indicating you (and possibly others) joined the conversation. If you are using the emulator, ' +
                            "pressing the 'Start Over' button to trigger this event again. The specifics of the 'ConversationUpdate' " +
                            'event depends on the channel. You can read more information at https://aka.ms/about-botframework-welcome-user');
                        await context.sendActivity(`It is a good pattern to use this event to send general greeting to user, explaining what your bot can do. ` +
                            `In this example, the bot handles 'hello', 'hi', 'help' and 'intro. ` +
                            `Try it now, type 'hi'`);
                    }
                }
            }
        });
    }
}

module.exports.WelcomeBot = WelcomeBot;
