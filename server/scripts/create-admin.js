require("dotenv").config();

const readline = require("node:readline");
const { promisify } = require("node:util");
const prisma = require("../src/config/prisma");
const { hashPassword } = require("../src/utils/hash");

const question = promisify(readline.Interface.prototype.question);

function ask(prompt) {
  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return question.call(terminal, prompt).finally(() => terminal.close());
}

function askHidden(prompt) {
  const input = process.stdin;
  const output = process.stdout;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    return Promise.reject(new Error("Rulează această comandă dintr-un terminal interactiv."));
  }

  readline.emitKeypressEvents(input);
  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  output.write(prompt);

  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      input.removeListener("keypress", onKeypress);
      input.setRawMode(wasRaw);
      output.write("\n");
    };
    const onKeypress = (character, key) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Operațiune anulată."));
      } else if (key.name === "return") {
        cleanup();
        resolve(value);
      } else if (key.name === "backspace") {
        value = value.slice(0, -1);
      } else if (character && !key.ctrl && !key.meta) {
        value += character;
      }
    };

    input.on("keypress", onKeypress);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL trebuie configurat în server/.env înainte de provisionare.");
  }
  if (!process.stdin.isTTY) {
    throw new Error("Rulează această comandă direct dintr-un terminal interactiv.");
  }

  const email = (await ask("Email admin: ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Adresa de email nu este validă.");
  }

  const name = (await ask("Nume admin: ")).trim();
  if (!name || name.length > 80) {
    throw new Error("Numele este obligatoriu și trebuie să aibă maximum 80 de caractere.");
  }

  const password = await askHidden("Parolă admin (minimum 12 caractere): ");
  if (password.length < 12 || Buffer.byteLength(password) > 256) {
    throw new Error("Parola trebuie să aibă minimum 12 și maximum 256 de octeți.");
  }
  const confirmation = await askHidden("Confirmă parola: ");
  if (password !== confirmation) {
    throw new Error("Parolele nu coincid.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: { email, name, passwordHash, role: "ADMIN" },
    });
    await tx.admin.create({ data: { email } });
  });
  console.log(`Contul admin ${email} a fost creat. Autentifică-te din workspace cu email și parolă.`);
}

main()
  .catch((error) => {
    if (error.code === "P2002") {
      console.error("Nu s-a creat contul: această adresă de email este deja folosită. Conturile existente nu sunt promovate.");
    } else {
      console.error(error.message);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
