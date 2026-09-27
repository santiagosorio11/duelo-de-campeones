import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Tratamiento de datos | Duelo de Campeones" };

// PLANTILLA: completa los campos resaltados (<mark>) y revísala con asesoría legal antes de lanzar.
export default function PrivacyPage() {
  return (
    <LegalPage title="Política de tratamiento de datos" updated="27 de septiembre de 2026">
      <p>
        Esta política explica cómo tratamos los datos personales que registras en el Duelo de Campeones, de acuerdo
        con la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015).
      </p>

      <h2>Responsable</h2>
      <p>
        <mark>[Razón social]</mark>, NIT <mark>[NIT]</mark>, con domicilio en <mark>[dirección y ciudad]</mark>.
        Contacto: <mark>[correo electrónico]</mark>, teléfono <mark>[teléfono]</mark>.
      </p>

      <h2>Qué datos recolectamos</h2>
      <ul>
        <li>Nombre completo y número de celular.</li>
        <li>Las calificaciones que registras: plato y número de estrellas.</li>
        <li>
          Datos técnicos para prevenir fraude: un identificador aleatorio del dispositivo, tu dirección IP convertida
          en un código irreversible y el tipo de navegador.
        </li>
      </ul>

      <h2>Para qué los usamos</h2>
      <ol>
        <li>Registrar tus calificaciones en el concurso.</li>
        <li>Verificar tu participación y realizar el sorteo del premio.</li>
        <li>Contactarte por llamada o mensaje si resultas ganador.</li>
        <li>Detectar y prevenir participaciones fraudulentas.</li>
        <li>Elaborar estadísticas agregadas y anónimas del concurso.</li>
      </ol>
      <p>No usaremos tus datos para enviarte publicidad sin una autorización adicional y separada.</p>

      <h2>Tus derechos</h2>
      <p>Como titular de los datos puedes, de forma gratuita:</p>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos.</li>
        <li>Solicitar prueba de la autorización que otorgaste.</li>
        <li>Ser informado sobre el uso que les damos.</li>
        <li>Revocar la autorización o pedir que eliminemos tus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
      </ul>

      <h2>Cómo ejercerlos</h2>
      <p>
        Escribe a <mark>[correo electrónico]</mark> con tu nombre, tu celular y tu solicitud. Respondemos las consultas
        en un máximo de 10 días hábiles y los reclamos en un máximo de 15 días hábiles.
      </p>

      <h2>Conservación y seguridad</h2>
      <p>
        Conservamos los datos durante la campaña y hasta <mark>[6 meses]</mark> después del sorteo; luego los
        eliminamos, salvo que una norma exija guardarlos. El acceso está restringido a los organizadores y la
        información viaja cifrada.
      </p>
      <p>
        Los datos se almacenan en servicios de infraestructura en la nube (Supabase y <mark>[proveedor de hosting]</mark>
        ), que pueden tener servidores fuera de Colombia y actúan como encargados bajo obligaciones de seguridad y
        confidencialidad.
      </p>

      <h2>Menores de edad</h2>
      <p>El concurso está dirigido a personas mayores de 18 años.</p>

      <h2>Vigencia</h2>
      <p>
        Esta política rige desde el <mark>[fecha]</mark>. Si la cambiamos, publicaremos la nueva versión en esta misma
        página.
      </p>
    </LegalPage>
  );
}
