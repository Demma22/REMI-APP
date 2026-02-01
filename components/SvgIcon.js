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
import FileIcon from '../assets/icons/file.svg';
import GraduationCapIcon from '../assets/icons/graduation_cap.svg';
import LocationIcon from '../assets/icons/location.svg';
import MessageIcon from '../assets/icons/message.svg';
import PlusIcon from '../assets/icons/plus.svg';
import RobotIcon from '../assets/icons/robot.svg';
import SmileIcon from '../assets/icons/smile.svg';
import UserIcon from '../assets/icons/user.svg';
import HomeIcon from '../assets/icons/home.svg';
import SendIcon from '../assets/icons/send.svg';
import TrashIcon from '../assets/icons/trash.svg';
import EyeIcon from '../assets/icons/eye.svg';
import MoonIcon from '../assets/icons/moon.svg';
import SunIcon from '../assets/icons/sun.svg';
import BellIcon from '../assets/icons/bell.svg';
import PdfIcon from '../assets/icons/pdf.svg';
import CheckcircleIcon from '../assets/icons/check-circle.svg';
import ArrowBackIcon from '../assets/icons/arrow-back.svg';

const iconComponents = {
  'home': HomeIcon,
  'eye': EyeIcon,
  'book': BookIcon,
  'bell': BellIcon,
  'arrow-back': ArrowBackIcon,
  'moon': MoonIcon,
  'check-circle': CheckcircleIcon,
  'pdf': PdfIcon,
  'sun': SunIcon,
  'send': SendIcon,
  'trash': TrashIcon,
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