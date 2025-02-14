const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const unzipper = require('unzipper');

async function fetchModule() {
  return await import('node-fetch');
}

const pythonScriptUrl =
  'https://github.com/jadenzaleski/BibleTranslations/archive/refs/heads/master.zip';

// Path to save the downloaded zip file
const zipFilePath = path.join(__dirname, 'bible_translations.zip');

async function downloadRepo() {
  const fetch = (await fetchModule()).default;

  try {
    const response = await fetch(pythonScriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to load repo: ${response.statusText}`);
    }
    const fileStream = fs.createWriteStream(zipFilePath);
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', resolve);
    });

    // Unzip the downloaded file
    await fs
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: __dirname }))
      .promise();

    fs.unlinkSync(zipFilePath); // Clean up the zip file
  } catch (error) {
    console.error(`Error downloading Python script: ${error}`);
    throw error;
  }
}

async function modifySQLFiles(translation) {
  const sqlFilePath = path.join(
    __dirname,
    'BibleTranslations-master',
    translation,
    `${translation}_bible.sql`,
  );

  if (!fs.existsSync(sqlFilePath)) {
    console.error(
      `SQL file for translation ${translation} not found: ${sqlFilePath}`,
    );
    return;
  }

  let sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  // Remove the CREATE TABLE statement
  sqlContent = sqlContent.replace(/create table \w+\(.*?\);/gis, '');

  // Modify INSERT statements to include translation column
  sqlContent = sqlContent.replace(
    /INSERT INTO \w+\(book_id, book, chapter, verse, text\) VALUES/gi,
    'INSERT INTO bible_verse (book_id, book, chapter, verse, text, translation) VALUES',
  );

  sqlContent = sqlContent.replace(
    /\((\d+,\s*'.*?',\s*\d+,\s*\d+,\s*'.*?')\)/gi,
    "($1, '" + translation + "')",
  );

  // Write the modified SQL back to the file
  fs.writeFileSync(sqlFilePath, sqlContent, 'utf-8');
  console.log(`Modified SQL file for translation: ${translation}`);
}

// Function to execute SQL files in PostgreSQL
async function executeSQLFiles(translation) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  let key = translation.toUpperCase();

  try {
    await client.connect();
    const sqlFilePath = path.join(
      __dirname,
      'BibleTranslations-master',
      key,
      `${key}_bible.sql`,
    );
    if (!fs.existsSync(sqlFilePath)) {
      console.error(
        `SQL file for translation ${key} not found: ${sqlFilePath}`,
      );
      return;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    // Execute the SQL commands
    console.log(`Executing SQL file for translation: ${key}`);
    await client.query(sqlContent);
    console.log(`Executed SQL file for translation: ${key}`);
  } catch (error) {
    console.error(`Error executing SQL file: ${error}`);
  } finally {
    await client.end();
  }
}

async function main() {
  const translations = [
    'AKLV',
    'ASV',
    'BRG',
    'EHV',
    'ESV',
    'ESVUK',
    'GNV',
    'GW',
    'ISV',
    'JUB',
    'KJ21',
    'KJV',
    'LEB',
    'MEV',
    'NASB',
    'NASB1995',
    'NET',
    'NIV',
    'NIVUK',
    'NKJV',
    'NLT',
    'NLV',
    'NOG',
    'NRSV',
    'NRSVUE',
    'WEB',
    // 'YLT',
  ];

  try {
    await downloadRepo();

    for (const translation of translations) {
      await modifySQLFiles(translation);

      await executeSQLFiles(translation);
    }
    fs.rmSync(path.join(__dirname, 'BibleTranslations-master'), {
      recursive: true,
    }); // Clean up the extracted folder
  } catch (error) {
    console.error(`Error processing translations: ${error}`);
  }
}

main();
