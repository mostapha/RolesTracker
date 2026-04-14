const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');
const jaroWinkler = require('jaro-winkler'); // Swap the import

config();


// Add this helper function anywhere above your parseSignupMessage function
function getBestMatch(inputString, arrayToMatch) {
  let bestMatch = { target: '', rating: 0 };
  
  for (const item of arrayToMatch) {
    let rating = jaroWinkler(inputString, item);
    
    // --- THE FIX: Length Penalty ---
    // Calculate how many characters different the two strings are
    const lenDiff = Math.abs(inputString.length - item.length);
    
    // If the difference is more than 2 characters, penalize the score
    // It subtracts 5% for every extra missing/added character past 2
    if (lenDiff > 2) {
      const penalty = (lenDiff - 2) * 0.05; 
      rating = rating - penalty;
    }

    if (rating > bestMatch.rating) {
      bestMatch = { target: item, rating };
    }
  }
  return bestMatch;
}


// Configuration
const TOKEN = process.env.BOT_TOKEN;

// --- CONFIGURATION ---
const SIGNUP_CHANNELS = ['1247901833188478996']; 
const GUILD_ID = '1247740449959968870';

const CATEGORY_ROLE_IDS = {
  'DPS': '1307656284258177034',
  'Support': '1307656969057734678',
  'Healer': '1307656873545175081',
  'Tank': '1307656261654937652'
};

const ROLE_SPLITTERS = ['/', '|', ',', ' or '];

// Fuzzy matching threshold (0 to 1). 0.8 means 80% similar.
// Adjust this if it's too aggressive or too strict.
const SIMILARITY_THRESHOLD = 0.9; 

const weaponAliases = {
  'perma': 'permafrost',
  'permafrost': 'permafrost',
  'fallen': 'fallen',
  'fallen staff': 'fallen',
  'golem': 'golem',
  'earthrune': 'golem',
  'polehammer': 'polehammer',
  'oathkeeper': 'oathkeeper',
  'outkepper': 'oathkeeper',
  'great frost': 'great frost',
  'oth': 'oathkeeper',
  'oath': 'oathkeeper',
  'routbound': 'rootbound',
  'rootbound': 'rootbound',
  'incubus': 'incubus',
  'icbues': 'incubus',
  'realm': 'realmbreaker',
  'relm': 'realmbreaker',
  'realmbreaker': 'realmbreaker',
  'spiked': 'spiked',
  'rift': 'rift',
  'berock': 'bedrock',
  'bedrock': 'bedrock',
  'bedroak': 'bedrock',
  'glaive': 'rift',
  'dawnsong': 'dawnsong',
  'downsog': 'dawnsong',
  'h-fall': 'hallowfall',
  'hallowfall': 'hallowfall',
  'hallow': 'hallowfall',
  'blight': 'blight',
  'rampant': 'rampant',
  'havemace': 'heavy mace',
  'h-mace': 'heavy mace',
  'heavy mace': 'heavy mace',
  'haevemace': 'heavy mace',
  'b-paws': 'bear paws',
  'bear paws': 'bear paws',
  'bb': 'bear paws',
  '1h mace': '1h mace',
  '1 hand mace': '1h mace',
  'mace': '1h mace',
  'lifecurse': 'lifecurse',
  'live course': 'lifecurse',
  'damnation': 'damnation',
  'dmna': 'damnation',
  'rotcaller': 'rotcaller',
  'oucult': 'occult',
  'occult': 'occult',
  '1 hand hummer': 'hammer',
  'hammer': 'hammer',
  'g-hammer': 'great hammer',
  'great hammer': 'great hammer',
  'hreathummer': 'great hammer',
  '1h hammer': '1h hammer',
  'enigmatic': 'enigmatic',
  'ingmtic': 'enigmatic',
  'inigmatic': 'enigmatic',
  'bracers': 'bracers',
  'brecers': 'bracers',
  'battle bracers': 'bracers',
  'redemption': 'redemption',
  'longbow': 'longbow',
  'bloodletter': 'bloodletter',
  '1 hand arcane': '1h arcane',
  '1h arcane': '1h arcane',
  '1hand arcan': '1h arcane',
  'great arcane': 'great arcane',
  'ga': 'great arcane',
  'spirithunter': 'spirithunter',
  'sprit': 'spirithunter',
  'hellfire': 'hellfire',
  'hfh': 'hellfire',
  'hellfireheands': 'hellfire',
  'hillfire': 'hellfire',
  'hilfirehands': 'hellfire',
  'hilfire hands': 'hellfire',
  'loucos': 'hellfire',
  'locus': 'locus',
  'locus_offensive': 'locus',
  'icicle': 'icicle',
  'icicle staff': 'icicle',
  'hoj': 'hoj',
  'hand of justice': 'hoj',
  'gril': 'grailseeker',
  'grail': 'grailseeker',
  'grilsker': 'grailseeker',
  'grailseeker': 'grailseeker',
  'carving': 'carving',
  'wild': 'wild',
  'nature': 'nature',
  '1h nature': 'nature',
  'holy': 'holy',
  'ib': 'infinity blade',
  'infinty': 'infinity blade',
  'infinity': 'infinity blade',
  'infinity blade': 'infinity blade',
  'infinity sword\'': 'infinity blade',
  'inf-blade': 'infinity blade',
  'infernal scythe': 'infernal scythe',
  'inf scythe': 'infernal scythe',
  'enfrnal s': 'infernal scythe',
  'galatine': 'galatine pairs',
  'galatines': 'galatine pairs',
  'gala': 'galatine pairs',
  'galatine pairs': 'galatine pairs',
  'camlann': 'camlann',
  'camlan mace': 'camlann',
  'staff of balance': 'staff of balance',
  'sob': 'staff of balance',
  'blackmonk': 'bms',
  'blackmonk staff': 'bms',
  'black monk staff': 'bms',
  'bms': 'bms',
  'dreadstorm': 'dreadstorm',
  'deadstorm mace': 'dreadstorm',
  'dread storm': 'dreadstorm',
  'astral': 'astral',
  'astral staff': 'astral',
  'hoarfrost': 'hoarfrost',
  'witchwork': 'witchwork',
  'wailing': 'wailing',
  'walling bow': 'wailing',
  'exalted staff': 'exalted',
  'exalted': 'exalted',
  'ursine maulers': 'ursine',
  'ursine': 'ursine',
  'ursyn': 'ursine',
  'shaper': 'shaper',
  'energy shaper': 'shaper',
  'soulscythe': 'soulscythe',
  'crystal hummer': 'truebolt hammer',
  'truebolt hammer': 'truebolt hammer',
  'sc': 'shadowcaller',
  'shadowcaller': 'shadowcaller',
  'forge hammers': 'forge hammers',
  'bl': 'bloodletter',
  'wildfire': 'wildfire',
  'wild staff': 'wild staff',
  'ww': 'witchwork',
  'fang': 'demon fangs',
  'cobra': 'cobra',
  'evensong': 'evensong',
  'mistpierser': 'mistpierser',
  'ava glove': 'fist of avalon',
  'halberd': 'halberd',
  'lightcaller': 'lightcaller',
  'kingmaker': 'kingmaker',
  'primal staff': 'primal staff',
  'bloodmoon staff': 'bloodmoon staff',
  'grovekeepers': 'grovekeepers',
  'govekeeper': 'grovekeepers',
  'carrion caller': 'carrion caller',
  'infernal staff': 'infernal staff',
  'demonic staff': 'demonic staff',
  'domnic staff': 'demonic staff'
};

const weaponCategories = {
  'carrion caller': 'DPS',
  'grovekeepers': 'Tank',
  'bloodmoon staff': 'DPS',
  'primal staff': 'Tank',
  'kingmaker': 'DPS',
  'lightcaller': 'DPS',
  'halberd': 'DPS',
  'fist of avalon': 'DPS',
  'mistpierser': 'DPS',
  'evensong': 'Support',
  'cobra': 'Support',
  'demon fangs': 'DPS',
  'wild staff': 'Healer',
  'wildfire': 'DPS',
  'forge hammers': 'Tank',
  'shadowcaller': 'Support',
  'truebolt hammer': 'Tank',
  'soulscythe': 'Tank',
  'shaper': 'DPS',
  'permafrost': 'DPS',
  'golem': 'Tank',
  'bedrock': 'Support',
  'polehammer': 'Tank',
  'oathkeeper': 'Support',
  'rootbound': 'Support',
  'incubus': 'Support',
  'realmbreaker': 'DPS',
  'spirithunter': 'DPS',
  'spiked': 'DPS',
  'rift': 'DPS',
  'dawnsong': 'DPS',
  'hallowfall': 'Healer',
  'blight': 'Healer',
  'rampant': 'Healer',
  'heavy mace': 'Tank',
  '1h mace': 'Tank',
  'lifecurse': 'Support',
  'damnation': 'Support',
  'roatcaller': 'Support',
  'occult': 'Support',
  'hammer': 'Tank',
  'great hammer': 'Tank',
  '1h hammer': 'Tank',
  'enigmatic': 'Support',
  'bracers': 'DPS',
  'redemption': 'Healer',
  'longbow': 'DPS',
  'bloodletter': 'DPS',
  '1h arcane': 'Support',
  'great arcane': 'Support',
  'hellfire': 'DPS',
  'locus': 'Support',
  'icicle': 'Support',
  'hoj': 'Tank',
  'grailseeker': 'Tank',
  'carving': 'Support',
  'fallen': 'Healer',
  'wild': 'Healer',
  'heal': 'Healer',
  'nature': 'Healer',
  'holy': 'Healer',
  'bear paws': 'DPS',
  'infinity blade': 'DPS',
  'infernal scythe': 'DPS',
  'galatine pairs': 'DPS',
  'camlann': 'Tank',
  'staff of balance': 'Tank',
  'bms': 'Tank',
  'healer': 'Healer',
  'dps': 'DPS',
  'great frost': 'DPS',
  'dreadstorm': 'Tank',
  'astral': 'DPS',
  'hoarfrost': 'Tank',
  'witchwork': 'DPS',
  'wailing': 'DPS',
  'exalted': 'Healer',
  'ursine': 'DPS',
  'infernal staff': 'Support',
};

const knownAliasKeys = Object.keys(weaponAliases);

// --- PRODUCTION FILE PATHS ---
const DB_FILE = path.join(__dirname, 'data/user-data.json');
const UNKNOWN_ROLES_FILE = path.join(__dirname, 'data/unknown-roles.json');
const STATE_FILE = path.join(__dirname, 'data/scan-state.json');

// --- HELPER FUNCTIONS ---
function loadJson(filePath, defaultData = {}) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return defaultData;
}

function saveJson(filePath, data) {
  // 1. Get the directory part of the path (e.g., 'C:\...\data')
  const dir = path.dirname(filePath);

  // 2. If the folder doesn't exist, create it (recursive: true makes sure it creates any missing parent folders too)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 3. Now it is safe to write the file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function splitRolesText(text) {
  let processedText = text;
  for (const splitter of ROLE_SPLITTERS) {
    processedText = processedText.split(splitter).join('|');
  }
  return processedText.split('|').map(w => w.trim()).filter(w => w.length > 0);
}

// --- MAIN PARSER ---
function parseSignupMessage(content, unknownRolesSet) {
  const signups = [];
  const regex = /^\d+\.\s+(.+?)\s*<@!?(\d+)>/gm;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const rawRoleText = match[1]
      .toLowerCase()
      .replace(/\([^)]*\)/g, '') // Removes everything enclosed in parentheses, including the parentheses themselves (e.g., "Hello (world)" becomes "Hello ").
      .replace(/\[[^\]]*\]/g, '') // Attempts to remove everything inside square brackets [ ]. Note: There appears to be a typo in your regex; `[^)]*` stops at a closing parenthesis instead of a closing bracket. It should probably be `/\[[^\]]*\]/g`.
      .replace(/\d+\.\s*/g, ' ') // Finds numbers followed by a period and optional whitespace (like "1. ", "20.  ") and replaces them with a single space.
      .replace(/\b(extra|head|royal|roayal|swap|demon|deamon|knight|kingth|kniht|guardian|judi|armor|robe|jacket|offensive|defensive|roal|roayl|cleance|cleanse|hood|r\d)\b\s*/g, ' ') // Removes specific keywords (and some misspelled variations) followed by whitespace, replacing them with a space. Note: The trailing `|)` is a bug that will match empty strings and insert extra spaces between every character. You likely want to remove that trailing pipe.
      .replace(/\s*[^/|,a-zA-Z\d\s-]\s*/g, ' ') // Strips out special characters. It removes anything that is NOT a letter, number, space, forward slash, pipe, comma, or hyphen, and replaces it (along with surrounding whitespace) with a single space.
      .replace(/\s+/g, ' ')
      .trim();
    const userId = match[2];

    if (!rawRoleText) continue;

    const weaponsArray = splitRolesText(rawRoleText);
        
    let foundCategories = new Set();
    let validWeapons = [];

    for (const rawWeapon of weaponsArray) {
      let normalized = weaponAliases[rawWeapon];
            
      // If no direct match, attempt fuzzy matching for typos
      if (!normalized) {
        const bestMatchInfo = getBestMatch(rawWeapon, knownAliasKeys);
        if (bestMatchInfo.rating >= SIMILARITY_THRESHOLD) {
          // console.log(`[Fuzzy Match] Mapped "${rawWeapon}" -> "${bestMatchInfo.target}" (${(bestMatchInfo.rating * 100).toFixed(1)}%)`);
          normalized = weaponAliases[bestMatchInfo.target];
        } else {
          unknownRolesSet.add(rawWeapon);
          continue;
        }
      }

      const category = weaponCategories[normalized];
      if (category) {
        foundCategories.add(category);
        validWeapons.push({ normalized, category });
      }
    }

    if (foundCategories.size > 1) {
      console.log(`Skipped mixed category slot for user ${userId}: ${rawRoleText}`);
      continue;
    }

    if (foundCategories.size === 1) {
      const finalCategory = Array.from(foundCategories)[0];
      signups.push({ userId, category: finalCategory, weapons: validWeapons.map(v => v.normalized) });
    }
  }

  return signups;
}

// --- PRODUCTION SCANNING LOGIC ---
async function runProductionScan(client) {
  console.log('Starting production scan...');
  const userData = loadJson(DB_FILE);
  const scanState = loadJson(STATE_FILE);
  const unknownRoles = new Set(loadJson(UNKNOWN_ROLES_FILE, []));
    
  const guild = await client.guilds.fetch(GUILD_ID);

  // 1. Create an object to hold deduplicated role assignments for this run
  // Format will be: { 'userId': Set(['ROLE_ID_TANK', 'ROLE_ID_DPS']) }
  const pendingRoleAssignments = {};

  for (const channelId of SIGNUP_CHANNELS) {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) continue;

      console.log(`\nScanning channel: ${channel.name || channelId}`);
            
      let currentAfterId = scanState[channelId];
      let messagesProcessed = 0;
      let latestMessageId = currentAfterId;
      let keepFetching = true;

      // Loop to fetch ALL messages after the saved state ID
      while (keepFetching) {
        const fetchOptions = { limit: 100 };
        if (currentAfterId) fetchOptions.after = currentAfterId;

        const messages = await channel.messages.fetch(fetchOptions);
        
        if (messages.size === 0) {
          break; // Exit loop if no new messages are found
        }

        const sortedMessages = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        
        for (const msg of sortedMessages) {
          const textToParse = msg.embeds.length > 0 && msg.embeds[0].description 
            ? msg.embeds[0].description 
            : msg.content;

          const parsedSignups = parseSignupMessage(textToParse, unknownRoles);

          for (const signup of parsedSignups) {
            // Update internal JSON data
            if (!userData[signup.userId]) {
              userData[signup.userId] = { categories: [], weapons: {} };
            }

            const userRecord = userData[signup.userId];

            if (!userRecord.categories.includes(signup.category)) {
              userRecord.categories.push(signup.category);
            }

            for (const w of signup.weapons) {
              userRecord.weapons[w] = (userRecord.weapons[w] || 0) + 1;
            }

            // Queue the role assignment instead of doing it immediately
            const roleIdToAssign = CATEGORY_ROLE_IDS[signup.category];
            if (roleIdToAssign) {
              if (!pendingRoleAssignments[signup.userId]) {
                pendingRoleAssignments[signup.userId] = new Set();
              }
              pendingRoleAssignments[signup.userId].add(roleIdToAssign);
            }
          }
        }
        
        // Update variables for the next pagination batch
        currentAfterId = sortedMessages[sortedMessages.length - 1].id;
        latestMessageId = currentAfterId;
        messagesProcessed += messages.size;

        console.log(`Fetched and processed batch of ${messages.size} messages...`);

        // If Discord returns less than 100 messages, we've hit the newest message in the channel
        if (messages.size < 100) {
          keepFetching = false;
        }
      }

      // Save the absolute newest message ID to state for the next cron run
      if (latestMessageId) {
        scanState[channelId] = latestMessageId;
      }
            
      console.log(`Finished channel ${channelId}. Processed a total of ${messagesProcessed} new messages.`);

    } catch (error) {
      console.error(`Error processing channel ${channelId}:`, error);
    }
  }

  // 2. Execute all deduplicated role assignments at the very end
  console.log('\nProcessing Discord role assignments...');
  for (const [userId, roleIds] of Object.entries(pendingRoleAssignments)) {
    try {
      // Fetch the member exactly once per run
      const member = await guild.members.fetch(userId);
      
      for (const roleId of roleIds) {
        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(roleId);
          
          // Find the category name (Tank, DPS, etc.) for a clean log message
          const categoryName = Object.keys(CATEGORY_ROLE_IDS).find(key => CATEGORY_ROLE_IDS[key] === roleId);
          console.log(`Assigned ${categoryName} role to ${member.user.tag}`);
        }
      }
    } catch (err) {
      console.log(`Failed to assign role(s) to user ID ${userId} (they may have left the server).`);
    }
  }

  // 3. Save all data and exit
  saveJson(DB_FILE, userData);
  saveJson(STATE_FILE, scanState);
  saveJson(UNKNOWN_ROLES_FILE, Array.from(unknownRoles));
    
  console.log('\nProduction scan completed successfully.');
  process.exit(0);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  runProductionScan(client);
});

client.login(TOKEN);