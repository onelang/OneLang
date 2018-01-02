use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    open my $fh, '<', "../../input/test.txt" or die "Can't open file $!";
    read $fh, my $file_content, -s $fh;
    close($fh);
    return $file_content;
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}