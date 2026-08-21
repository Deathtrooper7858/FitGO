const fs = require('fs');
const path = require('path');

const extraChallengesData = {
  en: {
    social: {
      friend: "Friend",
      friends: {
        friend: "friend"
      },
      challenges: {
        aiFallback: "Walk 10,000 steps for 3 consecutive days.",
        aiChallengePrefix: "AI Challenge",
        stepsPerDay: "Steps per day",
        calsPerDay: "Calories per day",
        startSolo: "Start (only me)",
        challenge: "Challenge",
        withoutMe: "without me",
        challengeOf: "Challenge of",
        selectSelfOrFriends: "Select yourself and/or your friends for this challenge.",
        participateInChallenge: "Participate in the challenge",
        acceptSolo: "Accept (only me)",
        acceptChallenge: "Accept Challenge"
      }
    }
  },
  es: {
    social: {
      friend: "Amigo",
      friends: {
        friend: "amigo"
      },
      challenges: {
        aiFallback: "Camina 10,000 pasos durante 3 días seguidos.",
        aiChallengePrefix: "Reto IA",
        stepsPerDay: "Pasos por día",
        calsPerDay: "Calorías por día",
        startSolo: "Comenzar (solo yo)",
        challenge: "Retar a",
        withoutMe: "sin mí",
        challengeOf: "Reto de",
        selectSelfOrFriends: "Selecciona a ti mismo y/o a tus amigos para este reto.",
        participateInChallenge: "Participar en el reto",
        acceptSolo: "Aceptar (solo yo)",
        acceptChallenge: "Aceptar Reto"
      }
    }
  },
  fr: {
    social: {
      friend: "Ami",
      friends: {
        friend: "ami"
      },
      challenges: {
        aiFallback: "Marchez 10 000 étapes pendant 3 jours consécutifs.",
        aiChallengePrefix: "Défi IA",
        stepsPerDay: "Étapes par jour",
        calsPerDay: "Calories par jour",
        startSolo: "Commencer (uniquement moi)",
        challenge: "Défier",
        withoutMe: "sans moi",
        challengeOf: "Défi de",
        selectSelfOrFriends: "Sélectionnez vous-même et/ou vos amis pour ce défi.",
        participateInChallenge: "Participer au défi",
        acceptSolo: "Accepter (uniquement moi)",
        acceptChallenge: "Accepter le Défi"
      }
    }
  },
  de: {
    social: {
      friend: "Freund",
      friends: {
        friend: "Freund"
      },
      challenges: {
        aiFallback: "Gehen Sie an 3 aufeinanderfolgenden Tagen 10.000 Schritte.",
        aiChallengePrefix: "KI-Herausforderung",
        stepsPerDay: "Schritte pro Tag",
        calsPerDay: "Kalorien pro Tag",
        startSolo: "Starten (nur ich)",
        challenge: "Herausfordern",
        withoutMe: "ohne mich",
        challengeOf: "Herausforderung von",
        selectSelfOrFriends: "Wählen Sie sich selbst und/oder Ihre Freunde für diese Herausforderung aus.",
        participateInChallenge: "An der Herausforderung teilnehmen",
        acceptSolo: "Akzeptieren (nur ich)",
        acceptChallenge: "Herausforderung annehmen"
      }
    }
  },
  it: {
    social: {
      friend: "Amico",
      friends: {
        friend: "amico"
      },
      challenges: {
        aiFallback: "Cammina per 10.000 passi per 3 giorni consecutivi.",
        aiChallengePrefix: "Sfida IA",
        stepsPerDay: "Passi al giorno",
        calsPerDay: "Calorie al giorno",
        startSolo: "Inizia (solo io)",
        challenge: "Sfida",
        withoutMe: "senza di me",
        challengeOf: "Sfida di",
        selectSelfOrFriends: "Seleziona te stesso e/o i tuoi amici per questa sfida.",
        participateInChallenge: "Partecipa alla sfida",
        acceptSolo: "Accetta (solo io)",
        acceptChallenge: "Accetta la Sfida"
      }
    }
  },
  pt: {
    social: {
      friend: "Amigo",
      friends: {
        friend: "amigo"
      },
      challenges: {
        aiFallback: "Caminhe 10.000 passos por 3 dias consecutivos.",
        aiChallengePrefix: "Desafio de IA",
        stepsPerDay: "Passos por dia",
        calsPerDay: "Calorias por dia",
        startSolo: "Começar (apenas eu)",
        challenge: "Desafiar",
        withoutMe: "sem mim",
        challengeOf: "Desafio de",
        selectSelfOrFriends: "Selecione a si mesmo e/ou seus amigos para este desafio.",
        participateInChallenge: "Participar do desafio",
        acceptSolo: "Aceitar (apenas eu)",
        acceptChallenge: "Aceitar Desafio"
      }
    }
  },
  ru: {
    social: {
      friend: "Друг",
      friends: {
        friend: "друг"
      },
      challenges: {
        aiFallback: "Проходите по 10 000 шагов 3 дня подряд.",
        aiChallengePrefix: "ИИ-Челендж",
        stepsPerDay: "Шагов в день",
        calsPerDay: "Калорий в день",
        startSolo: "Начать (только я)",
        challenge: "Бросить вызов",
        withoutMe: "без меня",
        challengeOf: "Испытание от",
        selectSelfOrFriends: "Выберите себя и/или своих друзей для этого испытания.",
        participateInChallenge: "Участвовать в испытании",
        acceptSolo: "Принять (только я)",
        acceptChallenge: "Принять вызов"
      }
    }
  }
};

const translationsDir = path.join(__dirname, '..', 'i18n', 'translations');

Object.entries(extraChallengesData).forEach(([lang, data]) => {
  const filePath = path.join(translationsDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!content.social) content.social = {};
  if (!content.social.friends) content.social.friends = {};
  if (!content.social.challenges) content.social.challenges = {};

  content.social.friend = data.social.friend;
  content.social.friends.friend = data.social.friends.friend;
  content.social.challenges = { ...content.social.challenges, ...data.social.challenges };

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Updated ${lang}.json with extra challenges keys successfully.`);
});
