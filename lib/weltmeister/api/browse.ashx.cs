using System.IO;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;
using System.Linq;

namespace ImpactJs.lib.weltmeister.api
{
    /// <summary>
    /// Summary description for browse
    /// </summary>
    public class browse : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {

            var fileRoot = System.Configuration.ConfigurationManager.AppSettings["fileRoot"];
            if (!fileRoot.EndsWith("/"))
                fileRoot += "/";

            var dir = (fileRoot + context.Request.QueryString["dir"]).Replace("//", "/");
            if (!dir.EndsWith("/"))
                dir += "/";

            var find = "*.*";
            switch (context.Request.QueryString["type"])
            {
                case "images":
                    find = "*.png,*gif,*jpg,*jpeg";
                    break;
                case "scripts":
                    find = "*.js";
                    break;
            }

            var mappeddir = context.Request.MapPath(dir);
            var mappedroot = context.Request.MapPath(fileRoot);

            var dirs = Directory.GetDirectories(mappeddir, "*", SearchOption.TopDirectoryOnly);

            var files = Directory.GetFiles(mappeddir, "*.*")
                                 .Where(f => (find == "*.*") || ((find != "*.*") && (find.Contains(Path.GetExtension(f).ToLower())))).ToArray();
    
            for (var i = 0; i < files.Count(); i++)
            {
                files[i] = files[i].Replace(mappedroot, string.Empty).Replace("\\", "/");
            }
            for (var i = 0; i < dirs.Length; i++)
            {
                dirs[i] = dirs[i].Replace(mappedroot, string.Empty).Replace("\\", "/");
            }

            var parent = dir;
            if (dir != "/")
            {
                var dirparts = dir.Split("/".ToCharArray(), System.StringSplitOptions.RemoveEmptyEntries);

                parent = "/";
                for (var i = 0; i < (dirparts.Length - 1); i++)
                {
                    parent += dirparts[i] + "/";
                }

            }
                
            context.Response.ContentType = "application/json";
            context.Response.ContentEncoding = Encoding.UTF8;
            var jserializer = new JavaScriptSerializer();
            context.Response.Write(jserializer.Serialize(new Response()
            {
                parent = parent,
                dirs = dirs,
                files = files
            }));
        }


        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

        public class Response
        {
            public string parent { get; set; }

            public string[] dirs { get; set; }

            public string[] files { get; set; }
        }
    }
}