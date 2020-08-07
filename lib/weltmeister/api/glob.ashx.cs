using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

namespace ImpactJs.lib.weltmeister.api
{
    /// <summary>
    /// Summary description for glob
    /// </summary>
    public class glob : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            var fileRoot = context.Request.MapPath(System.Configuration.ConfigurationManager.AppSettings["fileRoot"]);
            if (!fileRoot.EndsWith("/"))
                fileRoot += "/";

            var globs = context.Request.QueryString["glob[]"];
            List<string> files = new List<string>();
            //get the files
            foreach (var glob in globs.Split(','))
            {
                var pattern = glob.Replace("..", "").Replace("/","\\");
                files.AddRange(Directory.GetFiles(fileRoot, pattern));
            }

            //remove the fileRoot and reverse slashes
            for (var i = 0; i < files.Count;i++ )
            {
                files[i] = files[i].Replace(fileRoot, string.Empty);
                //files[i] = files[i].Replace(@"","/");
            }
            context.Response.ContentType = "application/json";
            context.Response.ContentEncoding = Encoding.UTF8;
            var jserializer = new JavaScriptSerializer();
            context.Response.Write(jserializer.Serialize(files));

            //   return "";
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}