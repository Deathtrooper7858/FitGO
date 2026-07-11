const fs = require('fs');
const path = require('path');

const translations = {
  es: {
    "competitive": {
      "squads": {
        "transferLeaderTitle": "Pasar Liderazgo",
        "transferLeaderMsg": "¿Pasar el liderazgo del squad a {{name}}? Perderás los permisos de creador.",
        "deleteSquadTitle": "Eliminar Squad",
        "deleteSquadMsg": "¿Estás seguro de que quieres eliminar tu squad permanentemente?",
        "delete": "Eliminar"
      }
    },
    "achievements": {
      "the_owner": {
        "title": "Propietario Absoluto",
        "desc": "Dueño de la plataforma FitGO."
      }
    },
    "profile": {
      "badges": {
        "owner": "Propietario"
      }
    }
  },
  en: {
    "competitive": {
      "squads": {
        "transferLeaderTitle": "Transfer Leadership",
        "transferLeaderMsg": "Transfer the squad leadership to {{name}}? You will lose creator permissions.",
        "deleteSquadTitle": "Delete Squad",
        "deleteSquadMsg": "Are you sure you want to permanently delete your squad?",
        "delete": "Delete"
      }
    },
    "achievements": {
      "the_owner": {
        "title": "Absolute Owner",
        "desc": "Owner of the FitGO platform."
      }
    },
    "profile": {
      "badges": {
        "owner": "Owner"
      }
    }
  },
  it: {
    "competitive": {
      "squads": {
        "transferLeaderTitle": "Trasferisci Leadership",
        "transferLeaderMsg": "Trasferire la leadership della squadra a {{name}}? Perderai i permessi di creatore.",
        "deleteSquadTitle": "Elimina Squadra",
        "deleteSquadMsg": "Sei sicuro di voler eliminare permanentemente la tua squadra?",
        "delete": "Elimina"
      }
    },
    "achievements": {
      "the_owner": {
        "title": "Proprietario Assoluto",
        "desc": "Proprietario della piattaforma FitGO."
      }
    },
    "profile": {
      "badges": {
        "owner": "Proprietario"
      }
    }
  },
  pt: {
    "competitive": {
      "squads": {
        "transferLeaderTitle": "Transferir Liderança",
        "transferLeaderMsg": "Transferir a liderança do esquadrão para {{name}}? Você perderá as permissões de criador.",
        "deleteSquadTitle": "Excluir Esquadrão",
        "deleteSquadMsg": "Tem certeza de que deseja excluir permanentemente o seu esquadrão?",
        "delete": "Excluir"
      }
    },
    "achievements": {
      "the_owner": {
        "title": "Proprietário Absoluto",
        "desc": "Proprietário da plataforma FitGO."
      }
    },
    "profile": {
      "badges": {
        "owner": "Proprietário"
      }
    }
  },
  ru: {
    "competitive": {
      "squads": {
        "transferLeaderTitle": "Передать Лидерство",
        "transferLeaderMsg": "Передать лидерство командой {{name}}? Вы потеряете права создателя.",
        "deleteSquadTitle": "Удалить Команду",
        "deleteSquadMsg": "Вы уверены, что хотите навсегда удалить свою команду?",
        "delete": "Удалить"
      }
    },
    "achievements": {
      "the_owner": {
        "title": "Абсолютный Владелец",
        "desc": "Владелец платформы FitGO."
      }
    },
    "profile": {
      "badges": {
        "owner": "Владелец"
      }
    }
  }
};

const i18nPath = path.join(__dirname, 'i18n', 'translations');

function setByPath(obj, pathArr, value) {
  let current = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    if (!current[pathArr[i]]) current[pathArr[i]] = {};
    current = current[pathArr[i]];
  }
  current[pathArr[pathArr.length - 1]] = value;
}

function processDict(targetData, dict, basePath = []) {
  for (const key in dict) {
    if (typeof dict[key] === 'string') {
      setByPath(targetData, [...basePath, key], dict[key]);
    } else {
      processDict(targetData, dict[key], [...basePath, key]);
    }
  }
}

for (const [lang, keys] of Object.entries(translations)) {
  const filePath = path.join(i18nPath, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    processDict(data, keys);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Patched ${lang}.json`);
  }
}
