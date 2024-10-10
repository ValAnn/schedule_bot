const LOG_SHEET_NAME = 'Logs'; 
const SHEET_NAME = 'Users';

const devChatId = '1593059';
var apiToken = "YOUR_API";
var appUrl   = "YOUR_URL";


const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME); 
const TOKEN = 'YOUR_TOKEN';

// LoggerBot - логгер, который записывает логи в отдельный лист в таблице
class LoggerBot {
  constructor(){
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(LOG_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(LOG_SHEET_NAME);
      sheet.appendRow(['Timestamp', 'Level', 'Message']);
    }
  }
  
  log(level, message) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(LOG_SHEET_NAME);
    
    const timestamp = new Date();
    sheet.appendRow([timestamp, level, message]);
    
    // Определяем цвет текста в зависимости от уровня
    let textColor;
    switch (level) {
      case 'INFO':
        textColor = '#4bad66'; // Зеленый
        break;
      case 'WARNING':
        textColor = '#c1c957'; // Желтый
        break;
      case 'ERROR':
        textColor = '#FF0000'; // Красный
        break;
      default:
        textColor = '#000000'; // Черный (по умолчанию)
    }
    
    // Получаем последний добавленный ряд
    const lastRow = sheet.getLastRow();
    
    // Устанавливаем цвет текста для ячеек уровня и сообщения
    sheet.getRange(lastRow, 2).setFontColor(textColor); // Уровень
    sheet.getRange(lastRow, 3).setFontColor(textColor); // Сообщение
  }
}

// UserStorage - функции для работы с файлом данных клиента

function getChatIdByPhoneNumber(number) {
  
  const data = sheet.getDataRange().getValues(); 

  for (let i = 1; i < data.length; i++) { 
    if (data[i][2].toString() === number.toString()) { 
      return data[i][0]; 
    }
  }

  return null;
}

function addUser(user_chat_id, message){
  try{
    if (getUserByChatId(user_chat_id) == null){
      const userData = message.split(' '); 
        
      const name = userData[0];
      const phone = userData[1];

      sheet.appendRow([user_chat_id, name, phone]);
      loggerBot.log("INFO", "Зарегистрирован новый пользователь " + user_chat_id);
      return;
    }
    else{
      if (updateUser(user_chat_id, message)){
          loggerBot.log("INFO", "Обновлена информация о пользователе " + user_chat_id);
      }
      else {
        loggerBot.log("WARNING", "Не удалось обновить информацию о пользователе " + user_chat_id);
      }
      return;
    }
    
  }
  catch (e){
    loggerBot.log("ERROR", "Error: " + e.toString());
  }
}

function deleteUser(user_chat_id){
  const data = sheet.getDataRange().getValues(); 

  for (let i = 1; i < data.length; i++) { 
    if (data[i][0].toString() === user_chat_id) { 
      sheet.deleteRow(i + 1);
      return;
    }
  }
    
    
}

function updateUser(user_chat_id, message){
  const data = sheet.getDataRange().getValues(); 

  for (let i = 1; i < data.length; i++) { 
    if (data[i][0].toString() === user_chat_id) { 
      const userData = message.split(' '); 
    
      const name = userData[0];
      const phone = userData[1];
      sheet.getRange(i + 1, 2).setValue(name);
      sheet.getRange(i + 1, 3).setValue(phone);
      return [user_chat_id, name, phone];
    }
  }
  return ;
     
}

function getUserByChatId(user_chat_id){
  const data = sheet.getDataRange().getValues(); 

  for (let i = 1; i < data.length; i++) { 
    if (data[i][0].toString() === user_chat_id) { 
      return [data[i][1], data[i][2]];
    }
  }
  return null;
     
}

//SendReminder - функция для отправки сообщения через бота
const loggerBot = new LoggerBot();
async function sendReminder() {
  
  loggerBot.log("INFO", "Начало рассылки напоминаний");
  const calendarId = CalendarApp.getDefaultCalendar().getId();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  
  const nextDay = new Date(tomorrow);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Получаем все события на следующий день
  const events = CalendarApp.getCalendarById(calendarId).getEvents(tomorrow, nextDay);

  if (events.length === 0) {
    loggerBot.log("INFO", "На завтра мероприятий нет");
    return;
  }

  events.forEach(event => {
    const eventTitle = event.getTitle();
    const eventDescription = event.getDescription();
    const eventStartTime = event.getStartTime();

    if (eventDescription) {
      user_chat_id = getChatIdByPhoneNumber(eventDescription);
      const message = `Напоминание: Завтра занятие в ${eventStartTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}`;
      loggerBot.log("INFO", "Cообщение отправлено пользователю " + user_chat_id + ". Занятие начнется в " + eventStartTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false}));
      sendMessage(getChatIdByPhoneNumber(eventDescription), message);
      Utilities.sleep(5000); 
    }
  });
}

//GetPost - обработка запросов
function doPost(e){
  try{
    var webhookData = JSON.parse(e.postData.contents);
    var from = webhookData.message.from.id;
    var text = webhookData.message.text;
    handleMessage(from, text);
  }
  catch (error){
    loggerBot.log("ERROR", error.toString());
  }
}

function doGet(e){
  return ContentService.createTextOutput("Method GET not allowed");
}

//RegistrationBot - регистрация новых пользователей

function handleMessage(chatId, message) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  try{
    if (message.startsWith('/start')) {
      loggerBot.log("INFO", "Начало регистрации пользователя " + chatId);
      sendMessage(chatId, "Пожалуйста, укажите фамилию и номер телефона через пробел.");
    } 
    else if (true) {
      addUser(chatId, message);
      sendMessage(chatId, "Вы успешно зарегистрированы!");
    } 
  }
  catch (e){
    loggerBot.log("FATAL", "Ошибка регистрации:  " + e.toString());
  }
}

function sendMessage(chatId, text) { 
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`; 
    const payload = { 
        chat_id: chatId, 
        text: text 
    }; 

    try {
        UrlFetchApp.fetch(url, { 
            method: 'post', 
            contentType: 'application/json', 
            payload: JSON.stringify(payload),
            muteHttpExceptions: true 
        }).getContentText(); 
    } catch (error) {
        Logger.log(`Error sending message: ${error}`);
    }
}

//WebHooks - установка и удаление веб-хука
function setWebhook() {
     const url = `https://api.telegram.org/bot${TOKEN}/setWebhook?url=${appUrl}`;
     UrlFetchApp.fetch(url);
     loggerBot.log("INFO", "Установление веб-хука");
}

async function removeWebhook() {
    const url = `https://api.telegram.org/bot${TOKEN}/deleteWebhook`;
    UrlFetchApp.fetch(url);    
}
