import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { supabase } from "../src/lib/supabase";
import { Link } from "expo-router";

type Store = { id: number; name: string; category: string | null; description: string | null; emoji: string | null };
type Product = { id: number; store_id: number; name: string; description: string | null; price_syp: number; emoji: string | null; is_available: boolean };
type CartItem = Product & { quantity: number };
const FEE = 200;
const money = (n: number) => new Intl.NumberFormat("ar-SY").format(n) + " ل.س";

export default function HomeScreen() {
 const [stores, setStores] = useState<Store[]>([]); const [products, setProducts] = useState<Product[]>([]);
 const [selectedStore, setSelectedStore] = useState<number | null>(null); const [cart, setCart] = useState<CartItem[]>([]);
 const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
 const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [address, setAddress] = useState(""); const [notes, setNotes] = useState("");
 const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [authBusy, setAuthBusy] = useState(false); const [userEmail, setUserEmail] = useState<string | null>(null); const [authMode, setAuthMode] = useState<"login"|"signup">("login");
 const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price_syp * item.quantity, 0), [cart]);
 async function load() {
  setLoading(true); setError("");
  const [s, p] = await Promise.all([
   supabase.from("stores").select("id,name,category,description,emoji").eq("is_active", true).order("id"),
   supabase.from("products").select("id,store_id,name,description,price_syp,emoji,is_available").eq("is_available", true).order("id")
  ]);
  if (s.error || p.error) setError("ما قدرنا نحمّل المتاجر والمنتجات. تأكد من اتصال قاعدة البيانات وصلاحياتها.");
  setStores((s.data ?? []) as Store[]); setProducts((p.data ?? []) as Product[]); setLoading(false);
 }
 useEffect(() => {
  load();
  supabase.auth.getSession().then(({data}) => setUserEmail(data.session?.user.email ?? null));
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user.email ?? null));
  return () => listener.subscription.unsubscribe();
 }, []);
 const visibleProducts = products.filter(p => selectedStore === null || p.store_id === selectedStore);
 function add(p: Product) { setCart(old => { const found = old.find(i => i.id === p.id); return found ? old.map(i => i.id === p.id ? {...i, quantity:i.quantity+1} : i) : [...old, {...p, quantity:1}]; }); }
 function changeQty(id: number, delta: number) { setCart(old => old.map(i => i.id===id ? {...i,quantity:i.quantity+delta} : i).filter(i=>i.quantity>0)); }
 async function handleAuth() {
  if (!email.trim() || !password || password.length < 6) { Alert.alert("بيانات الدخول", "اكتب البريد الإلكتروني وكلمة مرور من 6 أحرف على الأقل."); return; }
  setAuthBusy(true);
  const result = authMode === "signup"
    ? await supabase.auth.signUp({ email: email.trim(), password })
    : await supabase.auth.signInWithPassword({ email: email.trim(), password });
  setAuthBusy(false);
  if (result.error) { Alert.alert("تعذر تسجيل الدخول", result.error.message); return; }
  if (authMode === "signup" && !result.data.session) Alert.alert("تحقق من بريدك", "تم إنشاء الطلب؛ قد تحتاج لتأكيد البريد قبل تسجيل الدخول.");
  else Alert.alert(authMode === "signup" ? "تم إنشاء الحساب" : "أهلاً بعودتك", "تمت معالجة طلب الدخول.");
 }
 async function submitOrder() {
  if (!name.trim() || !phone.trim() || !address.trim()) { Alert.alert("بيانات ناقصة", "اكتب الاسم ورقم الهاتف وعنوان التوصيل."); return; }
  if (!cart.length) { Alert.alert("السلة فارغة", "أضف منتجات قبل إرسال الطلب."); return; }
  setBusy(true);
  const payload = { p_customer_name:name.trim(), p_customer_phone:phone.trim(), p_delivery_address:address.trim(), p_notes:notes.trim(), p_items:cart.map(i=>({product_id:i.id,quantity:i.quantity})) };
  const { data, error: rpcError } = await supabase.rpc("submit_delivery_order", payload);
  setBusy(false);
  if (rpcError) { Alert.alert("تعذر إرسال الطلب", "لم يتم تأكيد الطلب. تحقق من الاتصال ثم حاول مجدداً."); return; }
  const result = data as { order_number?: string; total_syp?: number } | null;
  Alert.alert("تم إرسال الطلب", "رقم الطلب: " + (result?.order_number ?? "قيد التأكيد") + "\nتأكد من متابعة حالة الطلب مع الإدارة.");
  setCart([]); setNotes("");
 }
 return <View style={styles.screen}><ExpoStatusBar style="light"/><StatusBar barStyle="light-content"/>
  <View style={styles.header}><Text style={styles.brand}>🍽️ ديليفري الأتارب</Text><Text style={styles.subtitle}>اطلب من متاجر منطقتك بسهولة</Text></View>
  <ScrollView contentContainerStyle={styles.content}>
   <View style={styles.hero}><Text style={styles.heroTitle}>أهلاً فيك 👋</Text><Text style={styles.muted}>اختار المتجر، أضف طلبك، وحدد عنوان التوصيل.</Text></View>\n   <Link href="/driver" style={{color:"#16834a",fontWeight:"800",textAlign:"right",marginBottom:8}}>🛵 دخول واجهة المندوب</Link>
   {!!error && <Text style={styles.error}>{error}</Text>}
   <View style={styles.rowTitle}><Text style={styles.sectionTitle}>المتاجر</Text><Pressable onPress={load}><Text style={styles.link}>تحديث</Text></Pressable></View>
   {loading ? <ActivityIndicator size="large" color="#16834a" style={{margin:24}}/> : <FlatList horizontal data={[{id:-1,name:"الكل",category:"",description:"",emoji:"🛍️"} as Store,...stores]} keyExtractor={i=>String(i.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:9,paddingVertical:8}} renderItem={({item})=><Pressable onPress={()=>setSelectedStore(item.id===-1?null:item.id)} style={[styles.storeChip, (selectedStore===item.id || (selectedStore===null&&item.id===-1))&&styles.storeChipActive]}><Text style={styles.storeEmoji}>{item.emoji||"🏪"}</Text><Text style={[styles.storeName,(selectedStore===item.id||(selectedStore===null&&item.id===-1))&&{color:"white"}]}>{item.name}</Text></Pressable>}/ >}
   <Text style={styles.sectionTitle}>حساب العميل</Text>
   <View style={styles.panel}>
    {userEmail ? <><Text style={styles.productName}>مسجل الدخول: {userEmail}</Text><Pressable style={[styles.addButton,{alignSelf:"flex-start",marginTop:10}]} onPress={async()=>{await supabase.auth.signOut();Alert.alert("تم تسجيل الخروج","تم إنهاء الجلسة.");}}><Text style={styles.addText}>تسجيل الخروج</Text></Pressable></> :
    <><Text style={styles.muted}>سجّل دخولك أو أنشئ حساباً بالبريد الإلكتروني.</Text><View style={styles.rowTitle}><Pressable onPress={()=>setAuthMode("login")}><Text style={styles.link}>تسجيل الدخول</Text></Pressable><Pressable onPress={()=>setAuthMode("signup")}><Text style={styles.link}>إنشاء حساب</Text></Pressable></View>
     <Text style={styles.label}>البريد الإلكتروني</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} placeholder="name@example.com"/>
     <Text style={styles.label}>كلمة المرور</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} placeholder="6 أحرف على الأقل"/>
     <Pressable disabled={authBusy} style={[styles.submit,authBusy&&{opacity:.5}]} onPress={handleAuth}><Text style={styles.submitText}>{authBusy?"جارٍ المعالجة…":authMode==="signup"?"إنشاء الحساب":"تسجيل الدخول"}</Text></Pressable>
    </>}
   </View>
   <Text style={styles.sectionTitle}>المنتجات</Text>
   {!loading && visibleProducts.length===0 && <View style={styles.panel}><Text style={styles.muted}>ما في منتجات ظاهرة حالياً ضمن هذا الاختيار.</Text></View>}
   {visibleProducts.map(p=><View key={p.id} style={styles.product}><Text style={styles.productEmoji}>{p.emoji||"🍽️"}</Text><View style={{flex:1}}><Text style={styles.productName}>{p.name}</Text>{!!p.description&&<Text style={styles.muted}>{p.description}</Text>}<Text style={styles.price}>{money(Number(p.price_syp)||0)}</Text></View><Pressable style={styles.addButton} onPress={()=>add(p)}><Text style={styles.addText}>+ أضف</Text></Pressable></View>)}
   <Text style={styles.sectionTitle}>سلة الطلب ({cart.reduce((a,i)=>a+i.quantity,0)})</Text>
   <View style={styles.panel}>{cart.length===0?<Text style={styles.muted}>السلة فارغة حالياً.</Text>:cart.map(i=><View key={i.id} style={styles.cartRow}><Text style={{flex:1,color:"#17211b"}}>{i.name} × {i.quantity}</Text><View style={styles.qty}><Pressable onPress={()=>changeQty(i.id,-1)}><Text style={styles.qtyText}>−</Text></Pressable><Pressable onPress={()=>changeQty(i.id,1)}><Text style={styles.qtyText}>＋</Text></Pressable></View><Text style={styles.price}>{money(i.price_syp*i.quantity)}</Text></View>)}
    <View style={styles.divider}/><View style={styles.totalRow}><Text>المجموع الفرعي</Text><Text>{money(subtotal)}</Text></View><View style={styles.totalRow}><Text>أجرة التوصيل الحالية</Text><Text>{money(FEE)}</Text></View><View style={styles.totalRow}><Text style={styles.totalLabel}>الإجمالي</Text><Text style={styles.totalLabel}>{money(subtotal+FEE)}</Text></View>
   </View>
   <Text style={styles.sectionTitle}>بيانات التوصيل</Text><View style={styles.panel}>
    <Text style={styles.label}>الاسم</Text><TextInput value={name} onChangeText={setName} style={styles.input} placeholder="اسمك الكامل" />
    <Text style={styles.label}>رقم الهاتف</Text><TextInput value={phone} onChangeText={setPhone} style={styles.input} placeholder="رقم للتواصل" keyboardType="phone-pad" />
    <Text style={styles.label}>عنوان التوصيل</Text><TextInput value={address} onChangeText={setAddress} style={styles.input} placeholder="الحي، الشارع، أقرب نقطة دالة" />
    <Text style={styles.label}>ملاحظات (اختياري)</Text><TextInput value={notes} onChangeText={setNotes} style={[styles.input,{minHeight:70,textAlignVertical:"top"}]} placeholder="أي تفاصيل إضافية" multiline />
    <Pressable disabled={busy||!cart.length} style={[styles.submit,(busy||!cart.length)&&{opacity:.5}]} onPress={submitOrder}><Text style={styles.submitText}>{busy?"جارٍ إرسال الطلب…":"تأكيد الطلب — "+money(subtotal+FEE)}</Text></Pressable>
    <Text style={styles.footnote}>أجرة التوصيل المعروضة ثابتة حالياً (200 ل.س)، وليست محسوبة حسب المسافة بعد.</Text>
   </View><Text style={styles.footer}>نسخة تطوير أولية • لا تُعتبر جاهزة للإطلاق التجاري بعد</Text>
  </ScrollView>
 </View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:"#f5f7f6"},header:{backgroundColor:"#16834a",paddingTop:Math.max(StatusBar.currentHeight||0,18)+10,paddingHorizontal:18,paddingBottom:18},brand:{color:"white",fontSize:23,fontWeight:"800",textAlign:"right"},subtitle:{color:"#e3f5e9",marginTop:4,textAlign:"right"},content:{padding:15,paddingBottom:36},hero:{backgroundColor:"#e8f5ec",padding:16,borderRadius:16,marginBottom:16},heroTitle:{fontSize:20,fontWeight:"800",color:"#17211b",textAlign:"right",marginBottom:5},muted:{color:"#66736b",fontSize:13,textAlign:"right"},error:{color:"#a12626",backgroundColor:"#ffe8e8",padding:12,borderRadius:10},rowTitle:{flexDirection:"row-reverse",justifyContent:"space-between",alignItems:"center"},sectionTitle:{fontSize:19,fontWeight:"800",color:"#17211b",textAlign:"right",marginTop:16,marginBottom:8},link:{color:"#16834a",fontWeight:"700"},storeChip:{backgroundColor:"white",borderWidth:1,borderColor:"#dce7df",borderRadius:13,padding:12,minWidth:94,alignItems:"center"},storeChipActive:{backgroundColor:"#16834a",borderColor:"#16834a"},storeEmoji:{fontSize:23},storeName:{fontWeight:"700",color:"#17211b",marginTop:4},product:{backgroundColor:"white",borderWidth:1,borderColor:"#e2e8e4",borderRadius:14,padding:12,marginVertical:5,flexDirection:"row-reverse",alignItems:"center",gap:10},productEmoji:{fontSize:30},productName:{fontSize:16,fontWeight:"800",textAlign:"right",color:"#17211b"},price:{fontWeight:"800",color:"#16834a",marginTop:4},addButton:{backgroundColor:"#e8f5ec",paddingHorizontal:12,paddingVertical:9,borderRadius:10},addText:{color:"#16834a",fontWeight:"800"},panel:{backgroundColor:"white",borderWidth:1,borderColor:"#e2e8e4",borderRadius:15,padding:14,marginBottom:8},cartRow:{flexDirection:"row-reverse",alignItems:"center",gap:8,paddingVertical:9},qty:{flexDirection:"row",gap:13,backgroundColor:"#f0f5f1",padding:6,borderRadius:8},qtyText:{fontWeight:"900",color:"#16834a",fontSize:17},divider:{height:1,backgroundColor:"#e2e8e4",marginVertical:10},totalRow:{flexDirection:"row-reverse",justifyContent:"space-between",paddingVertical:5},totalLabel:{fontWeight:"900",fontSize:17,color:"#17211b"},label:{textAlign:"right",fontWeight:"700",marginTop:8,color:"#17211b"},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#ccd7d0",borderRadius:10,padding:12,marginTop:6,textAlign:"right",fontSize:16},submit:{backgroundColor:"#16834a",borderRadius:12,padding:14,alignItems:"center",marginTop:10},submitText:{color:"white",fontWeight:"900",fontSize:16},footnote:{fontSize:12,color:"#8a5b00",textAlign:"right",marginTop:10},footer:{fontSize:12,color:"#66736b",textAlign:"center",marginVertical:22}});
