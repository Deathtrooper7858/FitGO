const fs = require('fs');

const files = ['en.json', 'es.json', 'fr.json', 'de.json', 'it.json', 'pt.json', 'ru.json'];

const translations = {
  en: {
    profile: {
      updateEmailPassword: 'Update Email or Password',
      updateAccountDesc: 'Enter your new email address or a new password. Only the fields you modify will be updated.',
      emailAndPasswordUpdated: 'Password updated. Please check the inbox of your new email to confirm the email change.',
      emailUpdated: 'Check the inbox of your new email to confirm the change.',
      passwordUpdated: 'Password updated successfully.',
      updateFailed: 'Failed to update your account.',
      samePasswordError: 'The new password must be different from the current password.',
      noChanges: 'You have not made any changes.'
    },
    auth: {
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Leave blank to keep current'
    }
  },
  es: {
    profile: {
      updateEmailPassword: 'Actualizar correo o contraseña',
      updateAccountDesc: 'Ingresa tu nuevo correo electrónico o una nueva contraseña. Solo se actualizarán los campos que modifiques.',
      emailAndPasswordUpdated: 'Contraseña actualizada. Por favor revisa tu bandeja de entrada en el nuevo correo para confirmar el cambio de email.',
      emailUpdated: 'Revisa la bandeja de entrada de tu nuevo correo para confirmar el cambio.',
      passwordUpdated: 'Contraseña actualizada correctamente.',
      updateFailed: 'Error al actualizar tu cuenta.',
      samePasswordError: 'La nueva contraseña debe ser diferente a la contraseña actual.',
      noChanges: 'No has realizado ningún cambio.'
    },
    auth: {
      newPassword: 'Nueva Contraseña',
      newPasswordPlaceholder: 'Deja en blanco para no cambiar'
    }
  },
  fr: {
    profile: {
      updateEmailPassword: 'Mettre à jour l\'e-mail ou le mot de passe',
      updateAccountDesc: 'Saisissez votre nouvel e-mail ou un nouveau mot de passe. Seuls les champs modifiés seront mis à jour.',
      emailAndPasswordUpdated: 'Mot de passe mis à jour. Veuillez vérifier la boîte de réception de votre nouvel e-mail pour confirmer le changement.',
      emailUpdated: 'Vérifiez la boîte de réception de votre nouvel e-mail pour confirmer le changement.',
      passwordUpdated: 'Mot de passe mis à jour avec succès.',
      updateFailed: 'Échec de la mise à jour de votre compte.',
      samePasswordError: 'Le nouveau mot de passe doit être différent du mot de passe actuel.',
      noChanges: 'Vous n\'avez apporté aucune modification.'
    },
    auth: {
      newPassword: 'Nouveau mot de passe',
      newPasswordPlaceholder: 'Laissez vide pour ne pas changer'
    }
  },
  de: {
    profile: {
      updateEmailPassword: 'E-Mail oder Passwort aktualisieren',
      updateAccountDesc: 'Geben Sie Ihre neue E-Mail-Adresse oder ein neues Passwort ein. Nur die geänderten Felder werden aktualisiert.',
      emailAndPasswordUpdated: 'Passwort aktualisiert. Bitte überprüfen Sie den Posteingang Ihrer neuen E-Mail, um die Änderung zu bestätigen.',
      emailUpdated: 'Überprüfen Sie den Posteingang Ihrer neuen E-Mail, um die Änderung zu bestätigen.',
      passwordUpdated: 'Passwort erfolgreich aktualisiert.',
      updateFailed: 'Fehler beim Aktualisieren Ihres Kontos.',
      samePasswordError: 'Das neue Passwort muss sich vom aktuellen Passwort unterscheiden.',
      noChanges: 'Sie haben keine Änderungen vorgenommen.'
    },
    auth: {
      newPassword: 'Neues Passwort',
      newPasswordPlaceholder: 'Leer lassen, um beizubehalten'
    }
  },
  it: {
    profile: {
      updateEmailPassword: 'Aggiorna Email o Password',
      updateAccountDesc: 'Inserisci il tuo nuovo indirizzo email o una nuova password. Solo i campi modificati verranno aggiornati.',
      emailAndPasswordUpdated: 'Password aggiornata. Controlla la casella di posta della tua nuova email per confermare il cambiamento.',
      emailUpdated: 'Controlla la casella di posta della tua nuova email per confermare il cambiamento.',
      passwordUpdated: 'Password aggiornata con successo.',
      updateFailed: 'Impossibile aggiornare il tuo account.',
      samePasswordError: 'La nuova password deve essere diversa da quella attuale.',
      noChanges: 'Non hai apportato alcuna modifica.'
    },
    auth: {
      newPassword: 'Nuova Password',
      newPasswordPlaceholder: 'Lascia vuoto per non cambiare'
    }
  },
  pt: {
    profile: {
      updateEmailPassword: 'Atualizar E-mail ou Senha',
      updateAccountDesc: 'Insira seu novo endereço de e-mail ou uma nova senha. Apenas os campos modificados serão atualizados.',
      emailAndPasswordUpdated: 'Senha atualizada. Verifique a caixa de entrada do seu novo e-mail para confirmar a alteração.',
      emailUpdated: 'Verifique a caixa de entrada do seu novo e-mail para confirmar a alteração.',
      passwordUpdated: 'Senha atualizada com sucesso.',
      updateFailed: 'Falha ao atualizar sua conta.',
      samePasswordError: 'A nova senha deve ser diferente da senha atual.',
      noChanges: 'Você não fez nenhuma alteração.'
    },
    auth: {
      newPassword: 'Nova Senha',
      newPasswordPlaceholder: 'Deixe em branco para não mudar'
    }
  },
  ru: {
    profile: {
      updateEmailPassword: 'Обновить Email или Пароль',
      updateAccountDesc: 'Введите ваш новый email или новый пароль. Будут обновлены только измененные поля.',
      emailAndPasswordUpdated: 'Пароль обновлен. Пожалуйста, проверьте входящие вашего нового email для подтверждения.',
      emailUpdated: 'Проверьте входящие вашего нового email для подтверждения изменения.',
      passwordUpdated: 'Пароль успешно обновлен.',
      updateFailed: 'Не удалось обновить ваш аккаунт.',
      samePasswordError: 'Новый пароль должен отличаться от текущего.',
      noChanges: 'Вы не внесли никаких изменений.'
    },
    auth: {
      newPassword: 'Новый Пароль',
      newPasswordPlaceholder: 'Оставьте пустым, чтобы не менять'
    }
  }
};

files.forEach(file => {
  const lang = file.replace('.json', '');
  if (!translations[lang]) return;
  
  const path = 'c:/Users/wrait/OneDrive/Desktop/programacion/fitgo/i18n/translations/' + file;
  let content = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  content.profile = { ...content.profile, ...translations[lang].profile };
  content.auth = { ...content.auth, ...translations[lang].auth };
  
  fs.writeFileSync(path, JSON.stringify(content, null, 2));
  console.log('Updated ' + file);
});
