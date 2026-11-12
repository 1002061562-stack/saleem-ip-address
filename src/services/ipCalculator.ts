import { IPAnalysisResult, IPClass, AddressType } from '../types';

export function parseIP(ipString: string): number[] | null {
  const parts = ipString.trim().split('.');
  if (parts.length !== 4) return null;
  const numbers = parts.map(p => Number(p));
  for (const n of numbers) {
    if (isNaN(n) || n < 0 || n > 255 || !Number.isInteger(n)) {
      return null;
    }
  }
  return numbers;
}

export function toBinary8(num: number): string {
  return num.toString(2).padStart(8, '0');
}

export function analyzeIP(ipString: string): IPAnalysisResult | null {
  const octets = parseIP(ipString);
  if (!octets) return null;

  const [o1, o2, o3, o4] = octets;
  const binary = octets.map(toBinary8);

  let detectedClass: IPClass = 'C';
  let defaultSubnetMask = '255.255.255.0';
  let cidr = 24;
  let networkAddress = `${o1}.${o2}.${o3}.0`;
  let hostAddress = `0.0.0.${o4}`;
  let broadcastAddress = `${o1}.${o2}.${o3}.255`;
  let addressType: AddressType = 'Public';
  let isPrivate = false;
  let explanationAr = '';

  // Class detection
  if (o1 >= 1 && o1 <= 126) {
    detectedClass = 'A';
    defaultSubnetMask = '255.0.0.0';
    cidr = 8;
    networkAddress = `${o1}.0.0.0`;
    hostAddress = `0.${o2}.${o3}.${o4}`;
    broadcastAddress = `${o1}.255.255.255`;
    explanationAr = 'الفئة A: البايت الأول يقع بين 1 و 126 (يبدأ بالبت 0). قناع الشبكة هو 255.0.0.0 (/8)، مما يعني 8 بتات للشبكة و24 بت للأجهزة.';
  } else if (o1 === 127) {
    detectedClass = 'A';
    defaultSubnetMask = '255.0.0.0';
    cidr = 8;
    networkAddress = '127.0.0.0';
    hostAddress = `0.${o2}.${o3}.${o4}`;
    broadcastAddress = '127.255.255.255';
    addressType = 'Loopback';
    explanationAr = 'عنوان Loopback محجوز لاختبار بطاقة الشبكة المحلية وتطبيق الحاسوب المحلي، أشهرها 127.0.0.1 (Localhost).';
  } else if (o1 >= 128 && o1 <= 191) {
    detectedClass = 'B';
    defaultSubnetMask = '255.255.0.0';
    cidr = 16;
    networkAddress = `${o1}.${o2}.0.0`;
    hostAddress = `0.0.${o3}.${o4}`;
    broadcastAddress = `${o1}.${o2}.255.255`;
    explanationAr = 'الفئة B: البايت الأول يقع بين 128 و 191 (يبدأ بالبتين 10). قناع الشبكة هو 255.255.0.0 (/16)، مما يعني 16 بت للشبكة و16 بت للأجهزة.';
  } else if (o1 >= 192 && o1 <= 223) {
    detectedClass = 'C';
    defaultSubnetMask = '255.255.255.0';
    cidr = 24;
    networkAddress = `${o1}.${o2}.${o3}.0`;
    hostAddress = `0.0.0.${o4}`;
    broadcastAddress = `${o1}.${o2}.${o3}.255`;
    explanationAr = 'الفئة C: البايت الأول يقع بين 192 و 223 (يبدأ بالبتات 110). قناع الشبكة هو 255.255.255.0 (/24)، 24 بت للشبكة و8 بت للأجهزة.';
  } else if (o1 >= 224 && o1 <= 239) {
    detectedClass = 'D';
    defaultSubnetMask = 'غير مخصص (Multicast)';
    cidr = 0;
    networkAddress = 'غير مخصص';
    hostAddress = 'غير مخصص';
    broadcastAddress = 'غير مخصص';
    addressType = 'Reserved';
    explanationAr = 'الفئة D: مخصصة للبث المتعدد (Multicast) لإرسال البيانات إلى مجموعة أجهزة معاً، لا تُعطى كعناوين للأجهزة الفردية.';
  } else {
    detectedClass = 'E';
    defaultSubnetMask = 'غير مخصص (تجارب)';
    cidr = 0;
    networkAddress = 'غير مخصص';
    hostAddress = 'غير مخصص';
    broadcastAddress = 'غير مخصص';
    addressType = 'Reserved';
    explanationAr = 'الفئة E: مخصصة للأبحاث والتجارب العلمية المستقبلية.';
  }

  // Check Private ranges (RFC 1918)
  if (o1 === 10) {
    isPrivate = true;
    addressType = 'Private';
  } else if (o1 === 172 && o2 >= 16 && o2 <= 31) {
    isPrivate = true;
    addressType = 'Private';
  } else if (o1 === 192 && o2 === 168) {
    isPrivate = true;
    addressType = 'Private';
  } else if (o1 === 169 && o2 === 254) {
    addressType = 'APIPA';
    isPrivate = true;
  } else if (o1 === 127) {
    addressType = 'Loopback';
  }

  // Check if it matches exact Network ID or Broadcast
  if (detectedClass === 'A' || detectedClass === 'B' || detectedClass === 'C') {
    const fullIp = `${o1}.${o2}.${o3}.${o4}`;
    if (fullIp === networkAddress) {
      addressType = 'Network';
    } else if (fullIp === broadcastAddress) {
      addressType = 'Broadcast';
    }
  }

  return {
    ip: `${o1}.${o2}.${o3}.${o4}`,
    binary,
    octets,
    detectedClass,
    defaultSubnetMask,
    cidr,
    networkAddress,
    hostAddress,
    broadcastAddress,
    addressType,
    isPrivate,
    explanationAr,
  };
}
