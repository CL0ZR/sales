import { NextResponse } from 'next/server';
import { createDebtCustomer } from '@/lib/queries/debts';

export async function POST() {
  try {
    // Generate 40 diverse debt customers with Arabic names
    const customers = [
      { name: 'أحمد محمد علي', phone: '07701234567', address: 'بغداد - الكرادة' },
      { name: 'فاطمة حسين جاسم', phone: '07702345678', address: 'بغداد - المنصور' },
      { name: 'محمود عبد الله سعيد', phone: '07703456789', address: 'البصرة - العشار' },
      { name: 'زينب خالد إبراهيم', phone: '07704567890', address: 'أربيل - عنكاوا' },
      { name: 'علي حسن رضا', phone: '07705678901', address: 'بغداد - الجادرية' },
      { name: 'مريم طارق عمر', phone: '07706789012', address: 'الموصل - الساعة' },
      { name: 'حسين عادل كريم', phone: '07707890123', address: 'النجف - الكوفة' },
      { name: 'سارة ياسر محمود', phone: '07708901234', address: 'كربلاء - المركز' },
      { name: 'عمر فارس صالح', phone: '07709012345', address: 'بغداد - الزعفرانية' },
      { name: 'نور الدين وليد', phone: '07710123456', address: 'ديالى - بعقوبة' },
      { name: 'رنا سمير أحمد', phone: '07711234567', address: 'بغداد - حي الأمين' },
      { name: 'كريم نبيل حسن', phone: '07712345678', address: 'السليمانية - المركز' },
      { name: 'هدى جمال عبد الرحمن', phone: '07713456789', address: 'بغداد - الدورة' },
      { name: 'مصطفى رامي جليل', phone: '07714567890', address: 'الأنبار - الرمادي' },
      { name: 'ليلى بشار فهد', phone: '07715678901', address: 'واسط - الكوت' },
      { name: 'يوسف مازن شاكر', phone: '07716789012', address: 'بغداد - الشعلة' },
      { name: 'دعاء عصام نوري', phone: '07717890123', address: 'ميسان - العمارة' },
      { name: 'حمزة زياد طه', phone: '07718901234', address: 'بغداد - البياع' },
      { name: 'شهد قصي حامد', phone: '07719012345', address: 'ذي قار - الناصرية' },
      { name: 'إبراهيم سعد جواد', phone: '07720123456', address: 'بغداد - الكاظمية' },
      { name: 'آية منذر عزيز', phone: '07721234567', address: 'صلاح الدين - تكريت' },
      { name: 'بلال أيمن فوزي', phone: '07722345678', address: 'بغداد - الأعظمية' },
      { name: 'ياسمين غسان ماجد', phone: '07723456789', address: 'بابل - الحلة' },
      { name: 'عدنان هشام رشيد', phone: '07724567890', address: 'بغداد - اليرموك' },
      { name: 'رغد حيدر عماد', phone: '07725678901', address: 'كركوك - المركز' },
      { name: 'سامي لؤي ضياء', phone: '07726789012', address: 'بغداد - الحرية' },
      { name: 'إسراء باسل وسام', phone: '07727890123', address: 'المثنى - السماوة' },
      { name: 'خالد شريف حكمت', phone: '07728901234', address: 'بغداد - الصدرية' },
      { name: 'منى راضي جبار', phone: '07729012345', address: 'القادسية - الديوانية' },
      { name: 'وسام عمار لقمان', phone: '07730123456', address: 'بغداد - الكريعات' },
      { name: 'بشرى فلاح سلمان', phone: '07731234567', address: 'دهوك - المركز' },
      { name: 'جاسم كاظم حيدر', phone: '07732345678', address: 'بغداد - الرصافة' },
      { name: 'سلمى عباس ناصر', phone: '07733456789', address: 'البصرة - الزبير' },
      { name: 'رائد مهدي فاضل', phone: '07734567890', address: 'بغداد - المشتل' },
      { name: 'نادية صباح عدنان', phone: '07735678901', address: 'نينوى - تلعفر' },
      { name: 'ماجد جعفر سامي', phone: '07736789012', address: 'بغداد - زيونة' },
      { name: 'هبة فراس ثامر', phone: '07737890123', address: 'الأنبار - الفلوجة' },
      { name: 'طارق صفاء عادل', phone: '07738901234', address: 'بغداد - الغدير' },
      { name: 'ريم سجاد محسن', phone: '07739012345', address: 'البصرة - أبو الخصيب' },
      { name: 'نزار ضرغام ستار', phone: '07740123456', address: 'بغداد - المأمون' },
    ];

    let addedCount = 0;
    const errors = [];

    for (const customer of customers) {
      try {
        createDebtCustomer(customer);
        addedCount++;
        // Small delay to ensure unique IDs
        await new Promise(resolve => setTimeout(resolve, 5));
      } catch (error) {
        console.error(`Error adding customer ${customer.name}:`, error);
        errors.push({ name: customer.name, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إضافة ${addedCount} عميل بنجاح إلى دفتر الديون`,
      data: {
        added: addedCount,
        total: customers.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Error seeding debt customers:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'فشل إضافة العملاء',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
