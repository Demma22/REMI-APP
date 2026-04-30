// components/SvgIcon.js
import React from 'react';
import { View } from 'react-native';
import BookIcon from '../assets/icons/book-solid-full.svg';
import CalculatorIcon from '../assets/icons/calculator.svg';
import CalendarIcon from '../assets/icons/calendar.svg';
import ChartLineIcon from '../assets/icons/chart_line.svg';
import ClockIcon from '../assets/icons/clock.svg';
import CogIcon from '../assets/icons/cog.svg';
import EditIcon from '../assets/icons/edit.svg';
import PencilIcon from '../assets/icons/pencil.svg';  
import FileIcon from '../assets/icons/file.svg';
import GraduationCapIcon from '../assets/icons/graduation_cap.svg';
import LocationIcon from '../assets/icons/location.svg';
import MessageIcon from '../assets/icons/message.svg';
import PlusIcon from '../assets/icons/plus.svg';
import RobotIcon from '../assets/icons/robot.svg';
import SmileIcon from '../assets/icons/smile.svg';
import UserIcon from '../assets/icons/user.svg';
import HomeIcon from '../assets/icons/home.svg';
import AboutIcon from '../assets/icons/info.svg';
import SendIcon from '../assets/icons/send.svg';
import TrashIcon from '../assets/icons/trash.svg';
import EyeIcon from '../assets/icons/eye.svg';
import MoonIcon from '../assets/icons/moon.svg';
import SunIcon from '../assets/icons/sun.svg';
import BellIcon from '../assets/icons/bell.svg';
import completeIcon from '../assets/icons/complete.svg';
import PdfIcon from '../assets/icons/pdf.svg';
import CheckcircleIcon from '../assets/icons/check-circle.svg';
import ArrowBackIcon from '../assets/icons/arrow-back.svg';
import PhoneIcon from '../assets/icons/phone.svg';
import WhatsappIcon from '../assets/icons/whatsapp.svg';
import MailIcon from '../assets/icons/mail.svg';
import InstagramIcon from '../assets/icons/instagram.svg';
import XIcon from '../assets/icons/x.svg';
import ThreadsIcon from '../assets/icons/threads.svg';
import TiktokIcon from '../assets/icons/tiktok.svg';
import AihomeIcon from '../assets/icons/ai_home.svg';
import gpaIcon from '../assets/icons/gpa.svg';
import timetableIcon from '../assets/icons/timetable.svg';
import scanIcon from '../assets/icons/scan.svg';
import appIcon from '../assets/icons/app.svg';
import webIcon from '../assets/icons/web.svg';
import focusIcon from '../assets/icons/focus.svg';
import habitIcon from '../assets/icons/habit.svg';
import friendsIcon from '../assets/icons/friends.svg';
import timeIcon from '../assets/icons/time.svg';
import otherIcon from '../assets/icons/other.svg';
import mediaIcon from '../assets/icons/media.svg';
import undergraduateIcon from '../assets/icons/undergraduate.svg';
import graduateIcon from '../assets/icons/graduate.svg';
import professionalIcon from '../assets/icons/professional.svg';
import nonStudentIcon from '../assets/icons/nonstudent.svg';
import productiveIcon from '../assets/icons/productive.svg';
import highschoolIcon from '../assets/icons/highschool.svg';
import lockIcon from '../assets/icons/lock.svg';
import calenderIcon from '../assets/icons/calender.svg';
import starIcon from '../assets/icons/star.svg';

const iconComponents = {
  'home': HomeIcon,
  'eye': EyeIcon,
  'instagram':InstagramIcon,
  'star': starIcon,
  'lock': lockIcon,
  'calender': calenderIcon,
  'x': XIcon,
  'threads': ThreadsIcon,
  'scan': scanIcon,
  'ai-home': AihomeIcon,
  'gpa': gpaIcon,
  'timetable': timetableIcon,
  'complete': completeIcon,
  'tiktok': TiktokIcon,
  'mail': MailIcon,
  'book': BookIcon,
  'info': AboutIcon,
  'bell': BellIcon,
  'whatsapp': WhatsappIcon,
  'media': mediaIcon,
  'phone': PhoneIcon,
  'arrow-back': ArrowBackIcon,
  'pencil': PencilIcon,
  'moon': MoonIcon,
  'check-circle': CheckcircleIcon,
  'pdf': PdfIcon,
  'sun': SunIcon,
  'send': SendIcon,
  'trash': TrashIcon,
  'productive': productiveIcon,
  'highschool': highschoolIcon,
  'other': otherIcon,
  'time': timeIcon,
  'friends': friendsIcon,
  'habit': habitIcon,
  'focus': focusIcon,
  'web': webIcon,
  'app': appIcon,
  'undergraduate': undergraduateIcon,
  'graduate': graduateIcon,
  'professional': professionalIcon,
  'nonstudent': nonStudentIcon,
  'highschool': highschoolIcon,
  'calculator': CalculatorIcon,
  'calendar': CalendarIcon,
  'chart-line': ChartLineIcon,
  'clock': ClockIcon,
  'cog': CogIcon,
  'edit': EditIcon,
  'file': FileIcon,
  'graduation-cap': GraduationCapIcon,
  'location': LocationIcon,
  'message': MessageIcon,
  'plus': PlusIcon,
  'robot': RobotIcon,
  'smile': SmileIcon,
  'user': UserIcon,
};

const SvgIcon = ({ name, size = 24, color = '#000', style }) => {
  const IconComponent = iconComponents[name];
  
  if (!IconComponent) {
    return <View style={{ width: size, height: size }} />;
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      <IconComponent width={size} height={size} fill={color} />
    </View>
  );
};

export default SvgIcon;