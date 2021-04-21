// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;
//settings:
const textColor = "#ffffff";
const opacity = 0.8;
//show the color of the calender in front of the title:  
  const showCalendarBullet = true;
//name of Calendar you don't want to see e.g. Siris recomandations:  
  const calendarTitle = "Found in Natural Language";
//insert your openweathermap api key here:    
  const APIKey ="";
//get current location or static location (be aware current location uses gps, therefore it could slow down the widget):      
  const staticLocation = true; 
  //if you use static location you have to add the location to these Variables:   
    let latitude = "52.264149";  
    let longitude = "10.526420";
  if(!staticLocation){
    const location = await Location.current();
    latitude = location.latitude;
    longitude = location.longitude;
  }  
 
//debug settings (debug has to be turnded off in order for the widget to run properly):
const debug = true;
const backgroundColor = "#000000";

//path to the weathericons
const base_path = "/var/mobile/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents/icons/";

//api request:
const weatherurl = "https://api.openweathermap.org/data/2.5/onecall?lat="+latitude+"&lon="+longitude+"&exclude=minutely,alerts&units=metric&appid=" + APIKey;

  
const weatherData = await apiRequest(weatherurl);


  

if(config.runsInWidget){
  
  let widget = await createWidget();
  Script.setWidget(widget);
  Script.complete();
} else if(debug) {
  Script.complete();
  let widget = await createWidget();
  await widget.presentLarge();
}



async function createWidget(){
  let widget = new ListWidget();
  
  if(debug){
  widget.backgroundColor = new Color(backgroundColor); 
  } else {
    let widgetParameterRAW = args.widgetParameter;
    
  
    try {
	 	const widgetParamter = widgetParameterRAW.toString();
 		setWidgetBackground(widget, widgetParamter);   
       
  
    } catch(e) {
	throw new Error("Please long press the widget and add a parameter.");  
    }
 
    
  }
    
  const globalStack = widget.addStack();
  globalStack.layoutVertically();
  
  await buildUpperPart(globalStack);
  globalStack.addSpacer(15);
  await buildMiddlePart(globalStack);
  await buildWeatherStack(globalStack);
  
  return widget;
}


/*
  The upper part of the Widget includes the Date and current weahter informations.
This method calls the different methods for the different parts.
*/
async function buildUpperPart(stack){
  const horizontalStack = stack.addStack();
  
  horizontalStack.layoutHorizontally();
  const leftStack = horizontalStack.addStack();
  horizontalStack.addSpacer();
  const rightStack = horizontalStack.addStack();
  
  await buildUpperLeftPart(leftStack)
  await buildUpperRightPart(rightStack)
}

/*
  the upper left part of the Widget contains the Date. 
  The format of the date is: Weekday, \n Day Month
*/

async function buildUpperLeftPart(stack){
  stack.layoutVertically();
  
  const date = new Date();
  const df = new DateFormatter();
  df.useFullDateStyle();
  const dateString = df.string(date);
  
  const weekday = dateString.substring(0, dateString.indexOf(',')+1)
  const today = dateString.substring(dateString.indexOf(',')+2,dateString.lastIndexOf(' '))
  
  const weekdayStack = stack.addStack();
  weekdayStack.layoutHorizontally();
  
  for(const letter of weekday){
    addWidgetTextLine(weekdayStack, letter, {
      font: Font.regularSystemFont(33),
      color: textColor
    })
    weekdayStack.addSpacer(2)
  }
  
  const todayStack = stack.addStack();
  todayStack.layoutHorizontally();
  
  for(const letter of today){
    addWidgetTextLine(todayStack, letter, {
      font: Font.regularSystemFont(33),
      color: textColor
    })
    todayStack.addSpacer(2)
  }
  
  

stack.addSpacer(8);
}

/*  
  The upper right part holds the current weatherinformations.
  The current Temperature. 
  The max- and min Temperature and the perecentage of precipitation from Today.
*/
async function buildUpperRightPart(stack){
  stack.layoutVertically();
  

  
  const tempratureStack = stack.addStack();
  tempratureStack.layoutHorizontally();
  tempratureStack.bottomAlignContent();
  
  const dailyTempStack = stack.addStack();
  dailyTempStack.layoutHorizontally();
  
  stack.addSpacer(2);
  
  const rainStack = stack.addStack();
  rainStack.layoutVertically();
    
  addWidgetTextLine(tempratureStack, Math.round(weatherData.current.temp)+"°", {
       font: Font.regularSystemFont(37),
       color: textColor
      
    })
    
  const iconStack = tempratureStack.addStack();
  iconStack.layoutVertically();
      
  const image = iconStack.addImage(Image.fromFile(await fetchImageLocal(weatherData.current.weather[0].icon)));
    image.imageSize = new Size(24, 24)
    
    iconStack.addSpacer(7);
    
    const weatherDataToday = weatherData.daily[0];
    addWidgetTextLine(dailyTempStack, "L: " + Math.round(weatherDataToday.temp.min) + "°",
    {
       font: Font.regularSystemFont(10),
       color: textColor
    } )
    
    dailyTempStack.addSpacer(6);
    
    addWidgetTextLine(dailyTempStack, "H: " + Math.round(weatherDataToday.temp.max) + "°",
    {
       font: Font.regularSystemFont(10),
       color: textColor
    } )
    
    addWidgetTextLine(rainStack, "Precipitation:", {
      font: Font.regularSystemFont(8),
       color: textColor
    })
    
    addWidgetTextLine(rainStack, Math.round(weatherDataToday.pop *100)+ " %", {
      font: Font.regularSystemFont(15),
      color: "#6699ff"
    })
}


/*  
  The middle part contains the reminders and the events from the calendar.
  By tapping on the differnt parts you open the calendar/reminders app
*/
async function buildMiddlePart(stack){ 

  const calendarWrapper = stack.addStack();
  calendarWrapper.layoutHorizontally();
  calendarWrapper.url = "calshow://";
  
  const calendarIconStack = calendarWrapper.addStack();    
  const calendaricon = calendarIconStack.addImage(Image.fromFile(await fetchImageLocal("calendaricon")));
  calendaricon.imageSize = new Size(30, 30);
  calendaricon.tintColor = new Color(textColor);
  
  calendarWrapper.addSpacer(15)
  const calendarStack = calendarWrapper.addStack();
  
  calendarStack.layoutVertically();
  await buildEventsView(calendarStack);
  
  stack.addSpacer(3)
  
  const remindersWrapper = stack.addStack();
  remindersWrapper.url = "x-apple-reminderkit://";
  remindersWrapper.layoutHorizontally();
  const remindersIconStack = remindersWrapper.addStack();
  const remindersicon =  remindersIconStack.addImage(Image.fromFile(await fetchImageLocal("remindersicon")));
  remindersicon.imageSize = new Size(30, 30);
  remindersicon.tintColor = new Color(textColor);
  
  remindersWrapper.addSpacer(15);
  
  const remindersStack = remindersWrapper.addStack();
  remindersStack.layoutVertically();
  remindersStack.addSpacer(4)
  await buildRemindersView(remindersStack)
  
  remindersStack.addSpacer();
  
}


/*  
  This is the bottom part of the widget and it contains the hourly forcast weather. 
It starts on the next full hour and is provided by the Openweather one call api
*/
async function buildWeatherStack(stack){
  const weatherStack = stack.addStack();
  weatherStack.url = "weather://"
  weatherStack.layoutHorizontally();

  
  const weatherDateHours = weatherData.hourly;
  
  
  
  const date = new Date();
  weatherStack.addSpacer();
  
  for (i=1;i<6;i++){
    
    const wrapper = weatherStack.addStack();  
    weatherStack.addSpacer();
    wrapper.layoutVertically();
   
    
    const upperStack = wrapper.addStack();
    wrapper.addSpacer(3);
    const middleStack = wrapper.addStack();
    wrapper.addSpacer(3);
    const bottomStack = wrapper.addStack();
    
    upperStack.setPadding(0, 0, 0, 0);
    upperStack.size = new Size(50, 12);
    middleStack.setPadding(0, 0, 0, 0);
    bottomStack.setPadding(0, 0, 0, 0);
    bottomStack.size = new Size(50, 14);
  
    upperStack.addSpacer();
    bottomStack.addSpacer();
    
    //the hour for which the weather is presented
    date.setHours(new Date().getHours() +i);
    addWidgetTextLine(upperStack, date.getHours()+ ":00", {
      color : textColor,
      font: Font.mediumSystemFont(11)
    })
    
    //the image belonging to the current weather situation
    const image = middleStack.addImage(Image.fromFile(await fetchImageLocal(weatherDateHours[i].weather[0].icon)));
    image.imageSize = new Size(50, 35)
    
     //the temperature
    addWidgetTextLine(bottomStack, Math.round(weatherDateHours[i].temp).toString()+"°", {
      color: textColor,
      font: Font.mediumSystemFont(14)
    });
    
    upperStack.addSpacer();
    bottomStack.addSpacer();
     
  }

  
}


/*  
  This method builds the different events from the calendar.
  It is going to display 3 events at most.
*/
async function buildEventsView(stack) {

  const date = new Date();

  //show all events in the next seven days
  let events = [];
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() + 7);
  events = await CalendarEvent.between(date, dateLimit);
  
  const futureEvents = [];
  for (const event of events) { 
	
    
      if(event.calendar.title == calendarTitle){
      continue;
    } 
      futureEvents.push(event);
  }


  if (futureEvents.length !== 0) {
    //show the next 3 events at most
    const numEvents = futureEvents.length > 3 ? 3 : futureEvents.length;
    for (let i = 0; i < numEvents; i += 1) {
      formatEvent(stack, futureEvents[i], textColor, opacity);
      
      
    }
  } else {
    
    
    addWidgetTextLine(stack, "new Event", {
      color: textColor,
      font: Font.mediumSystemFont(13),
      
    });
  }
 
}



/*  
  This method formats the events in the way they are displayed.
  The name of the event \n the date and the duration.
*/
function formatEvent(stack, event, color, opacity) {
  let eventLine = stack.addStack();
  eventLine.layoutHorizontally();
    
  
  if (showCalendarBullet) {
    addWidgetTextLine(eventLine, "❙ ", {
      color: event.calendar.color.hex,
      font: Font.mediumSystemFont(13),
      lineLimit: 1,
    });
  }
  //event title
  addWidgetTextLine(eventLine, event.title, {
    color,
    font: Font.mediumSystemFont(13),
    lineLimit: 1,
  });
  //event duration
  let time;
  if (event.isAllDay) {
    time = "All Day";
  } else {
    time = `${formatTime(event.startDate)} • ${calculateDurationMin(event.startDate, event.endDate)} min`;
    
  }
  

 
  const eventDate = new Date(event.startDate).getDate();
    let dF= new DateFormatter()
    dF.useShortDateStyle()
    let month = dF.string(event.startDate);
    month = month.substring(month.indexOf('.')+1, month.lastIndexOf('.'));
    
    time = `${eventDate}.${month} • ${time}`;
  

  addWidgetTextLine(stack, time, {
    color,
    opacity,
    font: Font.regularSystemFont(12),
    lineLimit: 1,
  });
  
  eventLine.addSpacer();
}


/*  
  This method creates the Remindersview.
  The title of the Reminder \n the Date and Time
*/
async function buildRemindersView(stack){
  
  //the next seven days including today
  let date = new Date(new Date().setHours(0));
  date.setMinutes(0);
  let dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() + 7);
  let reminders = await Reminder.incompleteDueBetween(date, dateLimit,[]);
  	
  if(reminders.length > 0){
    
    //sorting the reminders by dueDate
    reminders = reminders.sort(function(a,b){
      if(a.dueDate < b.dueDate){
        return -1;
      } else return 1;
    })
    
    let eventLine = stack.addStack();
    eventLine.layoutHorizontally();    
    let event = reminders[0];
    
    //show Calendarbullet
    if (showCalendarBullet) {
    addWidgetTextLine(eventLine, "❙ ", {
      color: event.calendar.color.hex,
      font: Font.mediumSystemFont(13),
      lineLimit: 1,
    });
    
    //event Title
    addWidgetTextLine(eventLine, event.title, {
    color: textColor,
    font: Font.mediumSystemFont(13)
    });
    
    //event dueDate
    let eventdate = event.dueDate;
    //change the color to red, if the dueDate is passed
    let remindersDueDateColor = textColor;
    if(eventdate < new Date()){
     remindersDueDateColor = "#bf3030"
    }
    let time = `${formatTime(eventdate)}`;
    let df = new DateFormatter();
    df.useShortDateStyle();
    eventdate = df.string(eventdate);
    
    eventdate = eventdate.substring(0, eventdate.lastIndexOf('.'));
    
    time = `${eventdate} • ${time}`;
    
    addWidgetTextLine(stack, time, {
      color: remindersDueDateColor,
      opacity,
      font: Font.regularSystemFont(12)
      });
    }
  }  
  
}


function getImageUrl(name){
  let fm = FileManager.iCloud();
  let dir = fm.documentsDirectory();
  return fm.joinPath(dir, `${name}`);
}



function setWidgetBackground(widget, imageName){
  const imageUrl = getImageUrl(imageName);
  widget.backgroundImage = Image.fromFile(imageUrl);
}



function addWidgetTextLine(
  widget,
  text,
  {
    color = "#ffffff",
    textSize = 12,
    opacity = 1,
    align,
    font = "",
    lineLimit = 0,
  }
) {
  let textLine = widget.addText(text);
  textLine.textColor = new Color(color);
  if (typeof font === "string") {
    textLine.font = new Font(font, textSize);
  } else {
    textLine.font = font;
  }
  textLine.textOpacity = opacity;
  textLine.lineLimit = lineLimit;
  switch (align) {
    case "left":
      textLine.leftAlignText();
      break;
    case "center":
      textLine.centerAlignText();
      break;
    case "right":
      textLine.rightAlignText();
      break;
    default:
      textLine.leftAlignText();
      break;
  }
}



function formatTime(date) {
  let dateFormatter = new DateFormatter();
  dateFormatter.useNoDateStyle();
  dateFormatter.useShortTimeStyle();
  return dateFormatter.string(date);
}



function calculateDurationMin(startDate, endDate){
    
    return ((endDate.getHours() - startDate.getHours()) * 60 )+ (endDate.getMinutes()- startDate.getMinutes());
}


async function apiRequest(url) {
  const request = new Request(url);
  const res = await request.loadJSON();
  
  return res;
}


async function fetchImageLocal(id){
  let fm = FileManager.iCloud();
  let finalPath = base_path + id + ".png";
	if(!fm.fileExists(base_path)){
	  fm.createDirectory(base_path);
	}

	if(!fm.fileExists(finalPath)){
      await downloadImg(id);  
      if(!fm.fileExists(finalPath)){
  	  throw new Error("Error file not found (even after download): " + path);
      }     
    }
  
  return finalPath;
}

async function downloadImg(id){
  let fm = FileManager.iCloud();
const url = "https://raw.githubusercontent.com/krumke/HomeWidget/master/icons/icons.json";
	const data = await apiRequest(url);
	
	let imgurl=null;
	switch (id){
	  case "01d":
		imgurl = data._01d;
	  break;
	  case "01n":
		imgurl = data._01n;
	  break;
	  case "02d":
		imgurl = data._02d;
	  break;
	  case "02n":
		imgurl = data._02n;
	  break;
	  case "03d":
		imgurl = data._03d;
	  break;
	  case "03n":
		imgurl = data._03n;
	  break;
	  case "04d":
		imgurl = data._04d;
	  break;
	  case "04n":
		imgurl = data._04n;
	  break;
	  case "09d":
		imgurl = data._09d;
	  break;
	  case "09n":
		imgurl = data._09n;
	  break;
	  case "10d":
		imgurl = data._10d;
	  break;
	  case "10n":
		imgurl = data._10n;
	  break;
	  case "11d":
		imgurl = data._11d;
	  break;
	  case "11n":
		imgurl = data._11n;
	  break;
	  case "13d":
		imgurl = data._13d;
	  break;
	  case "13n":
		imgurl = data._13n;
	  break;
	  case "50d":
		imgurl = data._50d;
	  break;
	  case "50n":
		imgurl = data._50n;
	  break;  
      case "calendaricon":
        imgurl = data.calendaricon;
      break;
      case "remindersicon":
        imgurl = data.remindersicon;
      break;
	}
	const image = await fetchimageurl(imgurl);
	fm.writeImage(base_path+id+".png",image);
}

async function fetchimageurl(url){
  const request = new Request(url);
  return request.loadImage();
}

